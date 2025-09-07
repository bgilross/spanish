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

const MainPage = () => {
	const lessons = useDataStore((s) => s.lessons)
	const currentLessonIndex = useDataStore((s) => s.currentLessonIndex)
	const currentSentenceIndex = useDataStore((s) => s.currentSentenceIndex)
	const initializeSentenceProgress = useDataStore(
		(s) => s.initializeSentenceProgress
	)
	const currentSentenceProgress = useDataStore((s) => s.currentSentenceProgress)
	const checkCurrentAnswer = useDataStore((s) => s.checkCurrentAnswer)
	const isLessonComplete = useDataStore((s) => s.isLessonComplete)
	const getLessonSummary = useDataStore((s) => s.getLessonSummary)

	const [showSummary, setShowSummary] = React.useState(false)
	const [saveStatus, setSaveStatus] = React.useState<
		| { state: "idle" }
		| { state: "saving" }
		| { state: "saved"; id?: string }
		| { state: "error"; message: string }
	>({ state: "idle" })
	const savedLessonNumbersRef = React.useRef<Set<number>>(new Set())
	const [showIntro, setShowIntro] = React.useState(true)
	const [showWordBank, setShowWordBank] = React.useState(false)
	const { data: session } = useSession()
	let userId = (session?.user as { id?: string } | undefined)?.id
	// Dev fallback (allows local testing of persistence without Google OAuth)
	if (!userId && process.env.NODE_ENV === "development") {
		const fake =
			process.env.NEXT_PUBLIC_DEV_FAKE_USER_ID || process.env.DEV_FAKE_USER_ID
		if (fake) userId = fake
	}

	React.useEffect(() => {
		setShowIntro(true)
		setShowSummary(false)
	}, [currentLessonIndex])

	const currentLesson = lessons[currentLessonIndex]
	const currentSentenceObject = currentLesson.sentences?.[currentSentenceIndex]

	React.useEffect(() => {
		initializeSentenceProgress()
	}, [initializeSentenceProgress, currentLessonIndex, currentSentenceIndex])

	React.useEffect(() => {
		if (!userId) return
		if (!isLessonComplete()) return
		const summary = getLessonSummary()
		if (savedLessonNumbersRef.current.has(summary.lessonNumber)) return
		savedLessonNumbersRef.current.add(summary.lessonNumber)
		setShowSummary(true)
		setSaveStatus({ state: "saving" })
		const payload = {
			userId,
			lessonNumber: summary.lessonNumber,
			summary,
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
	])

	const activeSectionOriginalIndex = React.useMemo(() => {
		const sections = currentSentenceProgress?.translationSections || []
		const next = sections.find((s) => !s.isTranslated)
		return next ? next.index : null
	}, [currentSentenceProgress])

	const onSubmit = (text: string) => {
		const res = checkCurrentAnswer(text)
		return { correct: res.correct }
	}

	return (
		<div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-zinc-100 px-4 pb-16">
			<div className="w-full max-w-3xl pt-6">
				<header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<h1 className="text-2xl font-semibold tracking-tight">
						Spanish Lesson Trainer
					</h1>
					<div className="flex items-center gap-3">
						{userId && (
							<a
								href="/dashboard"
								className="px-2 py-1 text-xs rounded border border-zinc-600 hover:bg-zinc-800"
							>
								Dashboard
							</a>
						)}
						<AuthButton />
						<LessonControls onBeforeSimulate={() => setShowSummary(false)} />
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
				/>

				<WordBankModal
					open={showWordBank && !showSummary}
					lesson={currentLesson}
					onClose={() => setShowWordBank(false)}
				/>

				<section className="mt-6 space-y-2 text-sm text-zinc-300">
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
								{currentSentenceIndex + 1} / {currentLesson.sentences?.length}
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
						</span>
					</div>
					<p className="text-base text-zinc-200 leading-relaxed">
						{currentSentenceObject?.sentence}
					</p>
				</section>

				<section className="mt-6">
					<div className="rounded-lg bg-zinc-800/60 backdrop-blur-sm border border-zinc-700 px-4 py-6 shadow-inner shadow-black/40">
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
						<div className="mt-4 flex flex-wrap items-center gap-3">
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
