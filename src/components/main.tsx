"use client"

import React from "react"
import { useDataStore } from "@/data/dataStore"
// no direct translation helpers needed here
import LessonControls from "@/components/LessonControls"
import SentenceLine from "@/components/SentenceLine"
import AnswerInput from "@/components/AnswerInput"
import SummaryModal from "@/components/SummaryModal"
import LessonIntroModal from "@/components/LessonIntroModal"
import DebugPanel from "@/components/DebugPanel"

const Main = () => {
	const lessons = useDataStore((state) => state.lessons)
	const currentLessonIndex = useDataStore((state) => state.currentLessonIndex)
	const currentSentenceIndex = useDataStore(
		(state) => state.currentSentenceIndex
	)
	const initializeSentenceProgress = useDataStore(
		(state) => state.initializeSentenceProgress
	)
	const currentSentenceProgress = useDataStore(
		(state) => state.currentSentenceProgress
	)
	const checkCurrentAnswer = useDataStore((state) => state.checkCurrentAnswer)
	const isLessonComplete = useDataStore((state) => state.isLessonComplete)
	const getLessonSummary = useDataStore((state) => state.getLessonSummary)

	const [showSummary, setShowSummary] = React.useState(false)
	const [showIntro, setShowIntro] = React.useState(true)

	// Open intro modal on initial load & whenever the lesson index changes
	React.useEffect(() => {
		setShowIntro(true)
		setShowSummary(false)
	}, [currentLessonIndex])

	// sizing kept in SentenceLine

	const currentLesson = lessons[currentLessonIndex]
	const currentSentenceObject = currentLesson.sentences?.[currentSentenceIndex]

	// Initialize progress whenever lesson or sentence changes
	React.useEffect(() => {
		initializeSentenceProgress()
	}, [initializeSentenceProgress, currentLessonIndex, currentSentenceIndex])

	// Open summary when lesson completes (quiz finished)
	React.useEffect(() => {
		if (isLessonComplete()) setShowSummary(true)
	}, [
		isLessonComplete,
		currentLessonIndex,
		currentSentenceIndex,
		currentSentenceProgress,
	])

	// Determine the next un-translated section index (original data index), if any
	const activeSectionOriginalIndex: number | null = React.useMemo(() => {
		const sections = currentSentenceProgress?.translationSections ?? []
		const next = sections.find((s) => !s.isTranslated)
		return next ? next.index : null
	}, [currentSentenceProgress])

	// Flash state remains here to keep behavior; handled inside AnswerInput

	const onSubmit = (text: string) => {
		const res = checkCurrentAnswer(text)
		return { correct: res.correct }
	}

	// simulation is handled by LessonControls

	return (
		<div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-zinc-100 px-4 pb-16">
			<div className="w-full max-w-3xl pt-6">
				<header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<h1 className="text-2xl font-semibold tracking-tight">
						Spanish Lesson Trainer
					</h1>
					<LessonControls onBeforeSimulate={() => setShowSummary(false)} />
				</header>

				{/* Summary modal */}
				{showSummary && (
					<SummaryModal
						open={showSummary}
						onClose={() => setShowSummary(false)}
						summary={getLessonSummary()}
					/>
				)}

				{/* Lesson intro modal */}
				<LessonIntroModal
					open={showIntro && !showSummary}
					lesson={currentLesson}
					lessonIndex={currentLessonIndex}
					totalLessons={lessons.length}
					onClose={() => setShowIntro(false)}
					onNavigate={(idx) => {
						if (idx >= 0 && idx < lessons.length) {
							// calling startNewLesson will trigger effect to reopen intro but we want to keep it open
							useDataStore.getState().startNewLesson(idx)
							setShowIntro(true)
						}
					}}
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
									) ?? []
								)
							}
							translated={
								new Set(
									currentSentenceProgress?.translationSections
										.filter((s) => s.isTranslated)
										.map((s) => s.index) ?? []
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
							currentSentenceProgress?.translationSections ?? []
						}
					/>
				</section>
			</div>
		</div>
	)
}

export default Main
