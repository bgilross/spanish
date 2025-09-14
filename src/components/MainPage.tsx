// Canonical lesson trainer component with persistence & logging.
// (Previous Main.tsx removed; this file now serves as the single source.)
"use client"

import React from "react"
import { useSession } from "next-auth/react"
import { AuthButton } from "@/components/AuthButton"
import { useDataStore } from "@/data/dataStore"
import LessonControls from "@/components/LessonControls"
import SentenceLine from "@/components/SentenceLine"
import AnswerInput from "@/components/AnswerInput"
import SummaryModal from "@/components/SummaryModal"
import LessonIntroModal from "@/components/LessonIntroModal"
import DebugPanel from "@/components/DebugPanel"
import WordBankModal from "@/components/WordBankModal"
import OriginalSentenceLine from "./OriginalSentenceLine"
import { APP_VERSION } from "@/lib/version"
import ImmediateFeedbackModal from "@/components/ImmediateFeedbackModal"

const MainPage = () => {
	const lessons = useDataStore((s) => s.lessons)
	const currentLessonIndex = useDataStore((s) => s.currentLessonIndex)
	const currentSentenceIndex = useDataStore((s) => s.currentSentenceIndex)
	const initializeSentenceProgress = useDataStore(
		(s) => s.initializeSentenceProgress
	)
	const currentSentenceProgress = useDataStore((s) => s.currentSentenceProgress)
	const checkCurrentAnswer = useDataStore((s) => s.checkCurrentAnswer)
	const immediateFeedbackMode = useDataStore((s) => s.immediateFeedbackMode)
	const markLastSubmissionHintRevealed = useDataStore(
		(s) => s.markLastSubmissionHintRevealed
	)
	const isLessonComplete = useDataStore((s) => s.isLessonComplete)
	const getLessonSummary = useDataStore((s) => s.getLessonSummary)
	const mixupMap = useDataStore((s) => s.mixupMap)

	const [showSummary, setShowSummary] = React.useState(false)
	const [saveStatus, setSaveStatus] = React.useState<
		| { state: "idle" }
		| { state: "saving" }
		| { state: "saved"; id?: string }
		| { state: "error"; message: string }
	>({ state: "idle" })
	// Immediate feedback modal state
	const [showImmediateModal, setShowImmediateModal] = React.useState(false)
	const [lastIncorrectInput, setLastIncorrectInput] = React.useState("")
	const [hintRevealed, setHintRevealed] = React.useState(false)
	const [lastIncorrectSectionIndex, setLastIncorrectSectionIndex] =
		React.useState<number | null>(null)
	const savedLessonNumbersRef = React.useRef<Set<number>>(new Set())
	// Start without the lesson info modal open by default
	const [showIntro, setShowIntro] = React.useState(false)
	const [showWordBank, setShowWordBank] = React.useState(false)
	const { data: session } = useSession()
	let userId = (session?.user as { id?: string } | undefined)?.id
	// Dev fallback (allows local testing of persistence without Google OAuth)
	if (!userId && process.env.NODE_ENV === "development") {
		const fake =
			process.env.NEXT_PUBLIC_DEV_FAKE_USER_ID || process.env.DEV_FAKE_USER_ID
		if (fake) userId = fake
	}

	// Track if we've already auto-selected based on last completion
	const autoSelectAppliedRef = React.useRef(false)

	// Fetch last completed lesson attempts and auto-select next lesson on initial load
	React.useEffect(() => {
		if (!userId) return
		if (autoSelectAppliedRef.current)
			return // Only run once after user id is available
		;(async () => {
			try {
				const res = await fetch(
					`/api/lessonAttempts?userId=${userId}&limit=100`
				)
				if (!res.ok) return
				const data = await res.json()
				const attempts: Array<{ lessonNumber: number }> = data.attempts || []
				if (attempts.length === 0) {
					autoSelectAppliedRef.current = true
					return
				}
				const maxCompleted = attempts.reduce(
					(acc, a) => (a.lessonNumber > acc ? a.lessonNumber : acc),
					0
				)
				// Determine target lesson index (maxCompleted + 1) within bounds
				const targetLessonNumber = Math.min(
					maxCompleted + 1,
					lessons[lessons.length - 1].lesson
				)
				// Find index by lesson number (lessons may not be contiguous in theory)
				const targetIndex = lessons.findIndex(
					(l) => l.lesson === targetLessonNumber
				)
				if (targetIndex >= 0 && targetIndex !== currentLessonIndex) {
					useDataStore.getState().startNewLesson(targetIndex)
				}
				autoSelectAppliedRef.current = true
			} catch (e) {
				console.warn("Auto-select lesson failed", e)
			}
		})()
	}, [userId, lessons, currentLessonIndex])

	// When user re-opens the lesson intro (back to lessons) after closing, we can re-align to last+1
	React.useEffect(() => {
		if (!showIntro) return
		if (!userId) return
		// Don't force after initial apply if user has manually navigated to a higher lesson already
		if (!autoSelectAppliedRef.current) return
		// We could optionally refresh attempts to catch newly completed lessons in another tab
	}, [showIntro, userId])

	React.useEffect(() => {
		// Do not auto-open the lesson intro modal on lesson index change.
		// Keep the modal closed by default; users can open it via controls.
		setShowSummary(false)
	}, [currentLessonIndex])

	const currentLesson = lessons[currentLessonIndex]
	const currentSentenceObject = currentLesson.sentences?.[currentSentenceIndex]
	const hasSentences = (currentLesson.sentences?.length || 0) > 0

	React.useEffect(() => {
		// Skip initialization for empty lessons
		if ((lessons[currentLessonIndex]?.sentences?.length || 0) === 0) return
		initializeSentenceProgress()
	}, [
		initializeSentenceProgress,
		currentLessonIndex,
		currentSentenceIndex,
		lessons,
	])

	React.useEffect(() => {
		if (!userId) return
		if (!isLessonComplete()) return
		const summary = getLessonSummary()
		// Include current mixup stats so they persist with the saved attempt
		const summaryWithMixups = { ...summary, mixupMap }
		if (savedLessonNumbersRef.current.has(summary.lessonNumber)) return
		savedLessonNumbersRef.current.add(summary.lessonNumber)
		setShowSummary(true)
		setSaveStatus({ state: "saving" })
		const payload = {
			userId,
			lessonNumber: summary.lessonNumber,
			summary: summaryWithMixups,
		}
		fetch("/api/lessonAttempts", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		})
			.then(async (r) => {
				if (!r.ok) {
					const txt = await r.text().catch(() => "")
					throw new Error(`Request failed ${r.status}: ${txt}`)
				}
				const data = await r.json()
				setSaveStatus({ state: "saved", id: data.attempt?.id })
			})
			.catch((e) => {
				console.error("[LessonAttempt] Save failed", e)
				setSaveStatus({ state: "error", message: e.message })
			})
	}, [
		userId,
		isLessonComplete,
		currentLessonIndex,
		currentSentenceIndex,
		currentSentenceProgress,
		getLessonSummary,
		mixupMap,
	])

	const activeSectionOriginalIndex = React.useMemo(() => {
		const sections = currentSentenceProgress?.translationSections || []
		const next = sections.find((s) => !s.isTranslated)
		return next ? next.index : null
	}, [currentSentenceProgress])

	const onSubmit = (text: string) => {
		if (!hasSentences) return { correct: false }
		const res = checkCurrentAnswer(text)
		if (!res.correct && immediateFeedbackMode) {
			setLastIncorrectInput(text)
			setHintRevealed(false)
			// capture active section index for expected answers
			setLastIncorrectSectionIndex(activeSectionOriginalIndex)
			setShowImmediateModal(true)
		}
		return { correct: res.correct }
	}

	const goPrevLesson = () => {
		if (currentLessonIndex > 0) {
			useDataStore.getState().startNewLesson(currentLessonIndex - 1)
			setShowIntro(true)
		}
	}
	const goNextLesson = () => {
		if (currentLessonIndex < lessons.length - 1) {
			useDataStore.getState().startNewLesson(currentLessonIndex + 1)
			setShowIntro(true)
		}
	}

	return (
		<div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-zinc-100 px-4 pb-20">
			<div className="w-full max-w-4xl pt-8">
				<header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
					<h1 className="text-xl sm:text-2xl font-semibold tracking-tight leading-tight flex items-center gap-2">
						Spanish Lesson Trainer
						<span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-200 font-mono select-none">
							v{APP_VERSION}
						</span>
					</h1>
					<div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
						{userId && (
							<a
								href="/dashboard"
								className="px-2 py-1 text-[11px] sm:text-xs rounded border border-zinc-600 hover:bg-zinc-800"
							>
								Dashboard
							</a>
						)}
						{process.env.NODE_ENV === "development" && userId && (
							<button
								onClick={async () => {
									if (!confirm("Clear ALL lesson attempts for this user?"))
										return
									try {
										const res = await fetch(
											`/api/lessonAttempts?userId=${userId}`,
											{
												method: "DELETE",
											}
										)
										if (!res.ok) throw new Error("Delete failed")
										// Reset auto-select so it can recompute (will land on lesson 1)
										autoSelectAppliedRef.current = false
										// Force re-run selection next effect cycle
										setShowIntro(true)
										alert("History cleared")
									} catch (e) {
										alert("Failed to clear history")
										console.error(e)
									}
								}}
								className="px-2 py-1 text-[11px] sm:text-xs rounded border border-red-600 text-red-300 hover:bg-red-900/40"
								title="Dev only: clear stored lesson attempts"
							>
								Clear History
							</button>
						)}
						<AuthButton />
						{/* Lesson controls forced to next line on very narrow screens */}
						<div
							className="flex-grow basis-full h-0 sm:hidden"
							aria-hidden
						/>
						<LessonControls
							compact
							onBeforeSimulate={() => setShowSummary(false)}
						/>
					</div>
				</header>

				{!userId && (
					<div className="mt-4 p-3 text-xs rounded border border-amber-500/40 bg-amber-500/5 text-amber-300">
						Sign in to record your progress. Lesson attempts won&#39;t be saved
						while signed out.
					</div>
				)}
				{!session?.user && userId && process.env.NODE_ENV === "development" && (
					<div className="mt-3 p-2 text-[10px] rounded border border-indigo-500/40 bg-indigo-500/5 text-indigo-300">
						Using local dev fallback user:{" "}
						<span className="font-mono">{userId}</span>
					</div>
				)}

				{showSummary && (
					<SummaryModal
						open={showSummary}
						onClose={() => setShowSummary(false)}
						summary={getLessonSummary()}
						saveStatus={saveStatus}
					/>
				)}

				<ImmediateFeedbackModal
					open={showImmediateModal && !showSummary}
					sentence={currentSentenceObject || null}
					section={
						lastIncorrectSectionIndex != null
							? currentSentenceObject?.data[lastIncorrectSectionIndex] || null
							: null
					}
					userInput={lastIncorrectInput}
					revealed={hintRevealed}
					onReveal={() => {
						setHintRevealed(true)
						markLastSubmissionHintRevealed()
					}}
					onRetry={() => {
						setShowImmediateModal(false)
						// focus will return to input naturally via effect
					}}
					onClose={() => setShowImmediateModal(false)}
				/>

				<LessonIntroModal
					open={showIntro && !showSummary}
					lesson={currentLesson}
					lessonIndex={currentLessonIndex}
					totalLessons={lessons.length}
					lessons={lessons}
					onClose={() => setShowIntro(false)}
					onNavigate={(idx) => {
						if (idx >= 0 && idx < lessons.length) {
							useDataStore.getState().startNewLesson(idx)
							setShowIntro(true)
						}
					}}
				/>

				<WordBankModal
					open={showWordBank && !showSummary}
					lesson={currentLesson}
					onClose={() => setShowWordBank(false)}
				/>

				<section className="mt-8 space-y-3 text-sm text-zinc-300">
					<div className="flex flex-wrap gap-x-6 gap-y-1">
						<span className="inline-flex items-center gap-1">
							<span className="text-zinc-400">Lesson:</span>
							<span className="font-medium text-zinc-100">
								{currentLesson.name}
							</span>
						</span>
						<span className="inline-flex items-center gap-1">
							<span className="text-zinc-400">Sentence:</span>
							<span className="font-medium text-zinc-100">
								{hasSentences
									? `${currentSentenceIndex + 1} / ${
											currentLesson.sentences?.length
									  }`
									: "—"}
							</span>
						</span>
						<span className="flex items-center gap-2 mt-2 w-full">
							<button
								className="px-2 py-1 text-xs rounded border border-zinc-500 hover:bg-zinc-800"
								onClick={() => setShowIntro(true)}
							>
								Lesson Info
							</button>
							<button
								className="px-2 py-1 text-xs rounded border border-zinc-500 hover:bg-zinc-800"
								onClick={() => setShowWordBank(true)}
							>
								Word Bank
							</button>
							<div className="flex gap-2 ml-auto">
								<button
									className="px-2 py-1 text-xs rounded border border-zinc-500 hover:bg-zinc-800 disabled:opacity-40"
									onClick={goPrevLesson}
									disabled={currentLessonIndex === 0}
								>
									Prev Lesson
								</button>
								<button
									className="px-2 py-1 text-xs rounded border border-zinc-500 hover:bg-zinc-800 disabled:opacity-40"
									onClick={goNextLesson}
									disabled={currentLessonIndex >= lessons.length - 1}
								>
									Next Lesson
								</button>
							</div>
						</span>
					</div>
					{/* Show original sentence line unless lesson has no sentences */}
					{hasSentences ? (
						<OriginalSentenceLine
							sentence={currentSentenceObject}
							activeIndex={activeSectionOriginalIndex}
						/>
					) : (
						<p className="text-sm text-zinc-400 mt-2">
							No sentences present in this lesson. Click &quot;Next Lesson&quot;
							to advance.
						</p>
					)}
				</section>

				{hasSentences && (
					<section className="mt-8">
						<div className="rounded-xl bg-zinc-800/60 backdrop-blur-sm border border-zinc-700 px-6 py-8 shadow-inner shadow-black/40">
							<SentenceLine
								sentence={currentSentenceObject}
								toTranslate={
									new Set(
										currentSentenceProgress?.translationSections.map(
											(s) => s.index
										) || []
									)
								}
								translated={
									new Set(
										(currentSentenceProgress?.translationSections || [])
											.filter((s) => s.isTranslated)
											.map((s) => s.index)
									)
								}
								activeIndex={activeSectionOriginalIndex}
								minCh={3}
								maxCh={20}
							/>
							<div className="mt-6 flex flex-wrap items-center justify-center gap-3">
								<AnswerInput
									activeIndex={activeSectionOriginalIndex}
									sentence={currentSentenceObject}
									onSubmit={onSubmit}
								/>
								{activeSectionOriginalIndex == null && (
									<span className="text-xs text-emerald-400 font-medium">
										Sentence complete
									</span>
								)}
							</div>
						</div>
					</section>
				)}

				<section className="mt-10">
					<DebugPanel
						currentLessonIndex={currentLessonIndex}
						currentSentenceIndex={currentSentenceIndex}
						sentenceText={currentSentenceObject?.sentence}
						activeIndex={activeSectionOriginalIndex}
						currentSentenceData={currentSentenceObject?.data}
						translationSections={
							currentSentenceProgress?.translationSections || []
						}
					/>
				</section>
			</div>
		</div>
	)
}

export default MainPage
