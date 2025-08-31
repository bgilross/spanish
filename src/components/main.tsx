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
			<div>
				<p>Current Lesson: {lessons[currentLessonIndex].name}</p>
				<p>
					Current Sentence Index: {currentSentenceIndex + 1} /{" "}
					{lessons[currentLessonIndex].sentences?.length}
				</p>
				<p>
					Sentence:{" "}
					{
						lessons[currentLessonIndex].sentences?.[currentSentenceIndex]
							?.sentence
					}
				</p>
			</div>
		</div>
	)
}

export default Main
