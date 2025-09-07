"use client"

import React from "react"
import { useDataStore } from "@/data/dataStore"
import { expectedAnswers } from "@/lib/translation"

type Props = {
	onBeforeSimulate?: () => void
	showSimulator?: boolean
	compact?: boolean
}

const LessonControls: React.FC<Props> = ({
	onBeforeSimulate,
	showSimulator = true,
	compact = false,
}) => {
	const lessons = useDataStore((s) => s.lessons)
	const currentLessonIndex = useDataStore((s) => s.currentLessonIndex)
	const startNewLesson = useDataStore((s) => s.startNewLesson)
	const isLessonComplete = useDataStore((s) => s.isLessonComplete)
	const initializeSentenceProgress = useDataStore(
		(s) => s.initializeSentenceProgress
	)

	const [simulating, setSimulating] = React.useState(false)

	const handleLessonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const index = parseInt(e.target.value)
		startNewLesson(index)
	}

	const simulateLesson = async () => {
		if (simulating) return
		onBeforeSimulate?.()
		setSimulating(true)
		try {
			// Ensure progress exists at start
			if (!useDataStore.getState().currentSentenceProgress) {
				initializeSentenceProgress()
				await new Promise((r) => setTimeout(r, 0))
			}

			let guard = 0
			while (!isLessonComplete() && guard < 10000) {
				const state = useDataStore.getState()
				const lesson = state.lessons[state.currentLessonIndex]
				const sentenceObj = lesson.sentences?.[state.currentSentenceIndex]
				const sections =
					state.currentSentenceProgress?.translationSections ?? []
				const next = sections.find((s) => !s.isTranslated)

				if (!sentenceObj) break

				if (!next) {
					if (!useDataStore.getState().currentSentenceProgress) {
						initializeSentenceProgress()
					}
					await new Promise((r) => setTimeout(r, 0))
					guard++
					continue
				}

				const entry = sentenceObj.data[next.index]
				const answers = expectedAnswers(entry)
				const correctAns = answers[0] ?? "si"

				// wrong then right
				useDataStore.getState().checkCurrentAnswer("__wrong__")
				await new Promise((r) => setTimeout(r, 0))
				useDataStore.getState().checkCurrentAnswer(correctAns)
				await new Promise((r) => setTimeout(r, 0))
				guard++
			}
		} finally {
			setSimulating(false)
		}
	}

	return (
		<div className="flex items-center gap-2 flex-wrap">
			<select
				value={currentLessonIndex}
				onChange={handleLessonChange}
				className={
					"border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-black text-white dark:bg-black dark:text-white max-w-full " +
					(compact
						? "px-2 py-1 text-[11px] sm:text-xs"
						: "px-2 py-1 text-xs sm:text-sm")
				}
				style={{ backgroundColor: "black", color: "white" }}
				aria-label="Select lesson"
			>
				{lessons.map((lesson, i) => {
					const baseLabel = compact
						? `L${lesson.lesson}: ${(lesson.details || lesson.name || "")
								.split(/\.\s|;|,|\n/)[0]
								.slice(0, 24)}${
								(lesson.details || lesson.name || "").length > 24 ? "…" : ""
						  }`
						: `Lesson ${lesson.lesson} - ${lesson.details}`
					return (
						<option
							key={i}
							value={i}
							className="bg-black text-white"
							title={lesson.details}
						>
							{baseLabel}
						</option>
					)
				})}
			</select>
			{showSimulator && (
				<button
					onClick={simulateLesson}
					disabled={simulating}
					className={
						"px-2 py-1 border rounded disabled:opacity-50 whitespace-nowrap " +
						(compact ? "text-[11px]" : "text-xs")
					}
					title="Simulate one wrong and one right answer per section"
				>
					{simulating
						? "Simulating…"
						: compact
						? "Simulate"
						: "Simulate lesson (wrong+right)"}
				</button>
			)}
		</div>
	)
}

export default LessonControls
