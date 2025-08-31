"use client"

import React from "react"
import { useDataStore } from "@/data/dataStore"

const Main = () => {
	const lessons = useDataStore((state) => state.lessons)
	const currentLessonIndex = useDataStore((state) => state.currentLessonIndex)
	const currentSentenceIndex = useDataStore(
		(state) => state.currentSentenceIndex
	)
	const startNewLesson = useDataStore((state) => state.startNewLesson)

	const handleLessonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const index = parseInt(e.target.value)
		startNewLesson(index)
	}

	const minCh = 3
	const maxCh = 20

	const currentLesson = lessons[currentLessonIndex]
	const currentSentenceObject = currentLesson.sentences?.[currentSentenceIndex]

	function splitWordAndPunct(text: string): { base: string; punct: string } {
		const m = text.match(/^([\s\S]*?)([.,!?:;…]+)$/)
		if (!m) return { base: text, punct: "" }
		return { base: m[1], punct: m[2] }
	}

	function approxChWidth(text: string, minCh = 3, maxCh = 20): number {
		const clean = text.replace(/[^A-Za-z0-9'áéíóúüñÁÉÍÓÚÜÑ]+/g, "")
		const len = clean.length || minCh
		return Math.max(minCh, Math.min(len, maxCh))
	}

	return (
		<div>
			<select
				value={currentLessonIndex}
				onChange={handleLessonChange}
				className="px-2 py-1 border rounded"
			>
				{lessons.map((lesson, i) => (
					<option
						key={i}
						value={i}
					>
						Lesson {lesson.lesson} - {lesson.details}
					</option>
				))}
			</select>

			<div className="mt-4">
				<p>Current Lesson: {currentLesson.name}</p>
				<p>
					Current Sentence Index: {currentSentenceIndex + 1} /{" "}
					{currentLesson.sentences?.length}
				</p>
				<p>Sentence: {currentSentenceObject?.sentence}</p>

				<div className="mt-2">
					{currentSentenceObject?.data.map((part, i) => {
						const hasTranslation =
							part.translation !== undefined && part.translation !== null
						const { base, punct } = splitWordAndPunct(part.phrase)

						const content = hasTranslation ? (
							<span
								className="inline-block align-baseline border-b-2 border-current h-[1.1em] leading-[1.1em] mx-1 select-none"
								style={{ width: `${approxChWidth(base, minCh, maxCh)}ch` }}
								aria-label="blank"
								aria-hidden="false"
							/>
						) : (
							<span className="inline-block align-baseline mx-1">{base}</span>
						)

						return (
							<React.Fragment key={i}>
								{content}
								{punct && (
									<span className="inline-block align-baseline">{punct}</span>
								)}
								{i < currentSentenceObject.data.length - 1 && (
									<span className="inline"> </span>
								)}
							</React.Fragment>
						)
					})}
				</div>
			</div>
			<div>
				<details open>
					<summary className="cursor-pointer">Debug Info</summary>
					<div>Current Section to be translated:</div>
					<pre>{JSON.stringify(currentSentenceObject, null, 2)}</pre>
				</details>
			</div>
		</div>
	)
}

export default Main
