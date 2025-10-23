// Canonical lesson trainer component with persistence & logging.
// (Previous Main.tsx removed; this file now serves as the single source.)
"use client"

import React from "react"
import { useSession } from "next-auth/react"
import { AuthButton } from "@/components/AuthButton"
import { useDataStore } from "@/data/dataStore"
import LessonControls from "@/components/LessonControls"
import { useRouter } from "next/navigation"
import SentenceLine from "@/components/SentenceLine"
import AnswerInput from "@/components/AnswerInput"
import SummaryModal from "@/components/SummaryModal"
import LessonIntroModal from "@/components/LessonIntroModal"
import AdminPanel from "@/components/AdminPanel"
import WordBankModal from "@/components/WordBankModal"
import ReportIssueModal from "@/components/ReportIssueModal"
import OriginalSentenceLine from "./OriginalSentenceLine"
import { APP_VERSION } from "@/lib/version"
import ImmediateFeedbackModal from "@/components/ImmediateFeedbackModal"
import SentenceCompleteModal from "@/components/SentenceCompleteModal"
import Tooltip from "@/components/Tooltip"
import { useViewAsUser } from "@/lib/viewAs"
import ViewAsHeaderToggle from "@/components/ViewAsHeaderToggle"
import { useShowCompleteAlways } from "@/lib/adminSettings"
import { useShowAdminPanel } from "@/lib/adminSettings"

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
	// toggleImmediateFeedbackMode will be used in the sentence card checkbox below
	const toggleImmediateFeedbackMode = useDataStore(
		(s) => s.toggleImmediateFeedbackMode
	)
	const markLastSubmissionHintRevealed = useDataStore(
		(s) => s.markLastSubmissionHintRevealed
	)
	const isLessonComplete = useDataStore((s) => s.isLessonComplete)
	const getLessonSummary = useDataStore((s) => s.getLessonSummary)
	const mixupMap = useDataStore((s) => s.mixupMap)
	const submissionLog = useDataStore((s) => s.submissionLog)

	const [showSummary, setShowSummary] = React.useState(false)
	const [showAdminPanel, setShowAdminPanel] = useShowAdminPanel()
	// Minimal typing for lesson summary snapshot used by the modal
	type LessonSummaryLike = {
		lessonNumber: number
		correctCount: number
		incorrectCount: number
		totalSubmissions: number
		correct: unknown[]
		incorrect: unknown[]
		references?: string[]
		mixupMap?: Record<string, Record<string, number>>
	}
	const [currentSummary, setCurrentSummary] =
		React.useState<LessonSummaryLike | null>(null)
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
	const [showSentenceCompleteModal, setShowSentenceCompleteModal] =
		React.useState(false)
	const [completedSentenceIndex, setCompletedSentenceIndex] = React.useState<
		number | null
	>(null)

	// Start without the lesson info modal open by default
	const [showIntro, setShowIntro] = React.useState(false)
	const [showWordBank, setShowWordBank] = React.useState(false)
	const { data: session } = useSession()
	const [mounted, setMounted] = React.useState(false)
	React.useEffect(() => setMounted(true), [])

	// Whether the current user is an admin (comes from NextAuth session)
	const rawIsAdmin = !!(session?.user as { isAdmin?: boolean } | undefined)
		?.isAdmin
	const [viewAsUser] = useViewAsUser()
	const isAdmin = rawIsAdmin && !viewAsUser
	const [showCompleteAlways] = useShowCompleteAlways()
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
		// When the lesson summary is shown, persist the attempt either to the server (if signed in)
		// or to localStorage (if anonymous). We include the current mixupMap snapshot so the
		// server can aggregate mixups into UserMixup rows.
		if (!showSummary) return
		// Avoid duplicate saves
		if (saveStatus.state !== "idle") return
		const summary = getLessonSummary()
		// capture a stable snapshot for the modal as well
		setCurrentSummary(summary as unknown as LessonSummaryLike)
		let cancelled = false
		;(async () => {
			try {
				setSaveStatus({ state: "saving" })
				if (userId) {
					const res = await fetch("/api/lessonAttempts", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							userId,
							lessonNumber: summary.lessonNumber,
							summary: { ...summary, mixupMap },
						}),
					})
					if (!res.ok) {
						let message = res.statusText
						try {
							const j = await res.json()
							message = j?.error || message
						} catch {}
						throw new Error(message)
					}
					const json = await res.json()
					if (!cancelled)
						setSaveStatus({ state: "saved", id: json?.attempt?.id })
				} else {
					// Anonymous: persist to localStorage so the dashboard can show local attempts
					try {
						const raw = localStorage.getItem("lessonAttempts:local") || "[]"
						const arr = JSON.parse(raw)
						const attempt = {
							id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
							userId: "local",
							lessonNumber: summary.lessonNumber,
							correctCount: summary.correctCount,
							incorrectCount: summary.incorrectCount,
							totalSubmissions: summary.totalSubmissions,
							references: summary.references || [],
							createdAt: new Date().toISOString(),
							summary: { ...summary, mixupMap },
						}
						const next = Array.isArray(arr) ? [attempt, ...arr] : [attempt]
						localStorage.setItem("lessonAttempts:local", JSON.stringify(next))
						if (!cancelled) setSaveStatus({ state: "saved", id: attempt.id })
					} catch (e) {
						if (!cancelled)
							setSaveStatus({
								state: "error",
								message:
									e instanceof Error ? e.message : "Failed to save locally",
							})
					}
				}
			} catch (e) {
				if (!cancelled)
					setSaveStatus({
						state: "error",
						message: e instanceof Error ? e.message : "Failed to save",
					})
			}
		})()
		return () => {
			cancelled = true
		}
	}, [showSummary, saveStatus.state, getLessonSummary, userId, mixupMap])

	React.useEffect(() => {
		const onOpen = () => setShowSummary(true)
		window.addEventListener("openLessonSummary", onOpen)
		return () => window.removeEventListener("openLessonSummary", onOpen)
	}, [])

	const activeSectionOriginalIndex = React.useMemo(() => {
		const sections = currentSentenceProgress?.translationSections || []
		const next = sections.find((s) => !s.isTranslated)
		return next ? next.index : null
	}, [currentSentenceProgress])

	const onSubmit = (text: string) => {
		if (!hasSentences) return { correct: false }
		const res = checkCurrentAnswer(text)
		if (res.advanced) {
			// capture the sentence index that just completed (store may advance)
			const completedIdx = currentSentenceIndex
			setCompletedSentenceIndex(completedIdx)
			// If any incorrect submissions were made for this sentence, show the modal.
			// Also show if the most recent submission was incorrect, or admin toggle is on.
			const lessonNum = currentLesson?.lesson
			const hadAnyErrors = submissionLog.some(
				(s) =>
					s.lessonNumber === lessonNum &&
					s.sentenceIndex === completedIdx &&
					!s.isCorrect
			)
			// If the lesson is now complete, show the lesson summary instead of the
			// sentence-complete modal. Summary takes precedence.
			if (isLessonComplete()) {
				setShowSentenceCompleteModal(false)
				setShowSummary(true)
			} else if (hadAnyErrors || !res.correct || showCompleteAlways) {
				setShowSentenceCompleteModal(true)
			}
		}
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

	const router = useRouter()

	// Report issue modal state
	const [showReportModal, setShowReportModal] = React.useState(false)
	const [reportContext, setReportContext] = React.useState<
		"general" | "lessonInfo" | "sentence"
	>("general")

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
					{/* Center area: show on all viewports so feedback/dashboard are mobile-accessible */}
					<div className="flex flex-1 items-center justify-start sm:pl-4">
						{/* Top-level general feedback button */}
						<button
							className="px-2 py-1 text-xs rounded border border-zinc-500 hover:bg-zinc-800 mr-3"
							onClick={() => {
								setReportContext("general")
								setShowReportModal(true)
							}}
							aria-label="Send feedback about site"
						>
							Send feedback
						</button>
						{!session?.user && (
							<button
								className="px-2 py-1 text-xs rounded border border-zinc-500 hover:bg-zinc-800"
								onClick={() => router.push("/dashboard")}
							>
								Open Dashboard
							</button>
						)}
					</div>
					<div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
						{/* Header toggle for admins to view the page as a regular user */}
						<ViewAsHeaderToggle mounted={mounted} />
						{/* Toggle visibility for Admin Panel (available to all users) */}
						{mounted && (
							<button
								className={`px-2 py-1 text-xs rounded border border-zinc-600 hover:bg-zinc-800 ${
									showAdminPanel ? "bg-zinc-800" : ""
								}`}
								onClick={() => setShowAdminPanel(!showAdminPanel)}
								aria-pressed={showAdminPanel}
							>
								Admin
							</button>
						)}
						<div className="flex items-center gap-3 ml-auto">
							{mounted && <AuthButton />}
						</div>
						{/* small-screen dashboard button removed because header now shows dashboard on all viewports */}
						{/* If lesson complete but summary is closed, allow reopening summary */}
						{/* Open Quiz Summary removed per request */}
						{/* Lesson controls forced to next line on very narrow screens */}
						<div
							className="flex-grow basis-full h-0 sm:hidden"
							aria-hidden
						/>
						<LessonControls
							compact
							showSimulator={false}
							showImmediateToggle={false}
							onBeforeSimulate={() => setShowSummary(false)}
						/>
					</div>
				</header>

				{mounted && !userId && (
					<div className="mt-4 p-3 text-xs rounded border border-amber-500/40 bg-amber-500/5 text-amber-300">
						You can use the dashboard locally while signed out — progress will
						be saved to your browser only and will not be persisted to the
						server.
					</div>
				)}
				{mounted &&
					!session?.user &&
					userId &&
					process.env.NODE_ENV === "development" && (
						<div className="mt-3 p-2 text-[10px] rounded border border-indigo-500/40 bg-indigo-500/5 text-indigo-300">
							Using local dev fallback user:{" "}
							<span className="font-mono">{userId}</span>
						</div>
					)}

				{showSummary && (
					<SummaryModal
						open={showSummary}
						onClose={() => {
							setShowSummary(false)
							setCurrentSummary(null)
							setSaveStatus({ state: "idle" })
						}}
						summary={
							(currentSummary as unknown as ReturnType<
								typeof getLessonSummary
							>) || getLessonSummary()
						}
						saveStatus={saveStatus}
						onNextLesson={goNextLesson}
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

				<SentenceCompleteModal
					open={showSentenceCompleteModal && !showSummary}
					sentence={currentLesson.sentences?.[completedSentenceIndex ?? -1]}
					submissions={submissionLog.filter(
						(s) =>
							s.lessonNumber === currentLesson.lesson &&
							s.sentenceIndex === (completedSentenceIndex ?? -1)
					)}
					onClose={() => setShowSentenceCompleteModal(false)}
					onNext={() => {
						setShowSentenceCompleteModal(false)
						useDataStore.getState().nextSentence()
					}}
				/>

				<LessonIntroModal
					open={showIntro && !showSummary}
					lesson={currentLesson}
					lessonIndex={currentLessonIndex}
					totalLessons={lessons.length}
					onClose={() => setShowIntro(false)}
					onNavigate={(idx) => {
						if (idx >= 0 && idx < lessons.length) {
							useDataStore.getState().startNewLesson(idx)
							setShowIntro(true)
						}
					}}
					onReport={() => {
						setReportContext("lessonInfo")
						setShowReportModal(true)
					}}
				/>

				<WordBankModal
					open={showWordBank && !showSummary}
					lesson={currentLesson}
					onClose={() => setShowWordBank(false)}
				/>

				<section className="mt-8 space-y-3 text-sm text-zinc-300">
					<div className="flex items-center justify-between flex-wrap gap-x-6 gap-y-1">
						<div className="flex items-center gap-6 flex-wrap">
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
								{/* Sentence selector dropdown */}
								{hasSentences && isAdmin && (
									<select
										aria-label="Select sentence"
										value={currentSentenceIndex}
										onChange={(e) => {
											const v = Number(e.target.value)
											// Update store directly to jump to sentence
											useDataStore.setState({
												currentSentenceIndex: v,
												currentSentenceProgress: null,
											})
										}}
										className="ml-3 bg-zinc-900 border border-zinc-700 text-sm px-2 py-1 rounded"
									>
										{Array.from({
											length: currentLesson.sentences?.length || 0,
										}).map((_, i) => (
											<option
												key={i}
												value={i}
											>
												{i + 1}
											</option>
										))}
									</select>
								)}
							</span>
						</div>
						<div className="ml-4 mt-2 sm:mt-0 flex items-center gap-3">
							<button
								aria-label="Previous lesson"
								className="px-4 py-2 text-sm rounded border border-zinc-500 hover:bg-zinc-800 disabled:opacity-40"
								onClick={goPrevLesson}
								disabled={currentLessonIndex === 0}
							>
								Prev Lesson
							</button>
							<button
								aria-label="Next lesson"
								data-next-lesson
								className={`px-4 py-2 text-sm rounded border border-zinc-500 hover:bg-zinc-800 disabled:opacity-40 ${
									isLessonComplete() ? "ring-2 ring-emerald-500" : ""
								}`}
								onClick={goNextLesson}
								disabled={currentLessonIndex >= lessons.length - 1}
							>
								Next Lesson
							</button>
						</div>
					</div>
					{/* If lesson has no sentences, show a helpful message. The original (untranslated)
						sentence line is rendered inside the sentence card below when sentences exist. */}
					{!hasSentences && (
						<p className="text-sm text-zinc-400 mt-2">
							No sentences present in this lesson. Click &quot;Next Lesson&quot;
							to advance.
						</p>
					)}
				</section>

				{hasSentences && (
					<section className="mt-8">
						<div className="rounded-xl bg-zinc-800/60 backdrop-blur-sm border border-zinc-700 px-6 py-8 shadow-inner shadow-black/40">
							{/* Controls placed inside the sentence card */}
							<div className="flex items-start justify-between mb-4">
								<div className="flex items-center gap-3">
									<button
										className="px-3 py-2 text-sm rounded border border-zinc-600 hover:bg-zinc-800"
										onClick={() => setShowIntro(true)}
									>
										Lesson Info
									</button>
									<button
										className="px-3 py-2 text-sm rounded border border-zinc-600 hover:bg-zinc-800"
										onClick={() => setShowWordBank(true)}
									>
										Word Bank
									</button>
								</div>
								<div className="flex items-center gap-2">
									<button
										className="px-3 py-2 text-sm rounded border border-zinc-600 hover:bg-zinc-800"
										onClick={() => {
											setReportContext("sentence")
											setShowReportModal(true)
										}}
									>
										Report issue
									</button>
									{/* Removed duplicate Lesson Info button - Lesson info modal already opened from left-side control. */}
								</div>
							</div>
							{/* Show full untranslated/original sentence with active underline above the blanked sentence */}
							<OriginalSentenceLine
								sentence={currentSentenceObject}
								activeIndex={activeSectionOriginalIndex}
							/>
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
							<div className="mt-4 flex justify-end">
								<Tooltip
									text={"enable instant feedback on every incorrect input"}
								>
									<label className="flex items-center gap-2 text-xs text-zinc-300">
										<input
											type="checkbox"
											checked={immediateFeedbackMode}
											onChange={() => toggleImmediateFeedbackMode()}
											className="accent-emerald-600"
											aria-label={
												"enable instant feedback on every incorrect input"
											}
										/>
										<span>Immediate feedback</span>
									</label>
								</Tooltip>
							</div>
						</div>
					</section>
				)}

				<AdminPanel
					mounted={mounted}
					rawIsAdmin={rawIsAdmin}
					userId={userId}
					currentLesson={currentLesson}
					currentLessonIndex={currentLessonIndex}
					currentSentenceIndex={currentSentenceIndex}
					currentSentenceObject={currentSentenceObject}
					activeIndex={activeSectionOriginalIndex}
					currentSentenceProgress={currentSentenceProgress ?? undefined}
					onSelectSentence={(idx) =>
						useDataStore.setState({
							currentSentenceIndex: idx,
							currentSentenceProgress: null,
						})
					}
					onClearHistory={async () => {
						if (!confirm("Clear ALL lesson attempts for this user?")) return
						try {
							const res = await fetch(`/api/lessonAttempts?userId=${userId}`, {
								method: "DELETE",
							})
							if (!res.ok) throw new Error("Delete failed")
							autoSelectAppliedRef.current = false
							setShowIntro(true)
							alert("History cleared")
						} catch (e) {
							alert("Failed to clear history")
							console.error(e)
						}
					}}
				/>

				{/* Report issue modal (extracted) */}
				<ReportIssueModal
					open={showReportModal}
					onClose={() => setShowReportModal(false)}
					lesson={currentLesson}
					sentence={currentSentenceObject}
					userId={userId}
					// For lesson-info and general reports, hide the checkboxes and sentence id
					hideCheckboxes={reportContext !== "sentence"}
					hideSentence={reportContext !== "sentence"}
					// Provide context so server can store where the report came from
					general={reportContext === "general"}
					// prop for including context in payload
					reportContext={reportContext}
				/>
			</div>
		</div>
	)
}

export default MainPage
