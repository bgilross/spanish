"use client"

import React from "react"
import { useDataStore } from "@/data/dataStore"
// no direct translation helpers needed here
import LessonControls from "@/components/LessonControls"
import SentenceLine from "@/components/SentenceLine"
import AnswerInput from "@/components/AnswerInput"
import SummaryModal from "@/components/SummaryModal"
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

	// lesson changes handled within LessonControls

	// sizing kept in SentenceLine

	const currentLesson = lessons[currentLessonIndex]
	const currentSentenceObject = currentLesson.sentences?.[currentSentenceIndex]

	// Initialize progress whenever lesson or sentence changes
	React.useEffect(() => {
		initializeSentenceProgress()
	}, [initializeSentenceProgress, currentLessonIndex, currentSentenceIndex])

	// Open summary when lesson completes
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
		<div>
			{/* Summary modal */}
			{showSummary && (
				<SummaryModal
					open={showSummary}
					onClose={() => setShowSummary(false)}
					summary={getLessonSummary()}
				/>
			)}
			<LessonControls onBeforeSimulate={() => setShowSummary(false)} />

			<div className="mt-4">
				<p>Current Lesson: {currentLesson.name}</p>
				<p>
					Current Sentence Index: {currentSentenceIndex + 1} /{" "}
					{currentLesson.sentences?.length}
				</p>
				<p> {currentSentenceObject?.sentence}</p>

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
				<div className="mt-3 flex items-center gap-2">
					<AnswerInput
						activeIndex={activeSectionOriginalIndex}
						sentence={currentSentenceObject}
						onSubmit={onSubmit}
					/>
				</div>
			</div>
			<DebugPanel
				currentLessonIndex={currentLessonIndex}
				currentSentenceIndex={currentSentenceIndex}
				sentenceText={currentSentenceObject?.sentence}
				activeIndex={activeSectionOriginalIndex}
				currentSentenceData={currentSentenceObject?.data}
				translationSections={currentSentenceProgress?.translationSections ?? []}
			/>
		</div>
	)
}

export default Main
