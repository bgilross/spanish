"use client"

import { useDataStore } from "@/data/dataStore"
import { expectedAnswers } from "@/lib/translation"

export async function simulateLessonOnce() {
	// Mirror the simulateLesson behavior from LessonControls but as a callable helper.
	if (!useDataStore.getState().currentSentenceProgress) {
		useDataStore.getState().initializeSentenceProgress?.()
		await new Promise((r) => setTimeout(r, 0))
	}
	let guard = 0
	const isLessonComplete = useDataStore.getState().isLessonComplete
	const initializeSentenceProgress =
		useDataStore.getState().initializeSentenceProgress
	while (!isLessonComplete?.() && guard < 10000) {
		const state = useDataStore.getState()
		const lesson = state.lessons[state.currentLessonIndex]
		const sentenceObj = lesson.sentences?.[state.currentSentenceIndex]
		const sections = state.currentSentenceProgress?.translationSections ?? []
		const next = sections.find((s) => !s.isTranslated)
		if (!sentenceObj) break
		if (!next) {
			if (!useDataStore.getState().currentSentenceProgress) {
				initializeSentenceProgress?.()
			}
			await new Promise((r) => setTimeout(r, 0))
			guard++
			continue
		}
		const entry = sentenceObj.data[next.index]
		const answers = expectedAnswers(entry)
		const correctAns = answers[0] ?? "si"
		useDataStore.getState().checkCurrentAnswer("__wrong__")
		await new Promise((r) => setTimeout(r, 0))
		useDataStore.getState().checkCurrentAnswer(correctAns)
		await new Promise((r) => setTimeout(r, 0))
		guard++
	}

	// If simulation finished the lesson, notify UI to open the lesson summary
	try {
		if (isLessonComplete?.()) {
			if (typeof window !== "undefined") {
				window.dispatchEvent(new Event("openLessonSummary"))
			}
		}
	} catch {}
}
