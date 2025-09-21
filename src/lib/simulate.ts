"use client"

import { useDataStore } from "@/data/dataStore"
import { expectedAnswers } from "@/lib/translation"
import {
	resolveExpectedVerb,
	pickAlternativeVerb,
	type WrongVerbStrategy,
} from "@/lib/verbErrors"

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
			// If there are no sections or all are translated, advance to next sentence
			const rawSectionCount = Array.isArray(sentenceObj.data)
				? sentenceObj.data.filter((e: unknown) => {
						if (!e || typeof e !== "object") return false
						return "translation" in (e as Record<string, unknown>)
				  }).length
				: 0
			if (rawSectionCount === 0 || sections.every((s) => s.isTranslated)) {
				useDataStore.getState().nextSentence()
				await new Promise((r) => setTimeout(r, 0))
				guard++
				continue
			}

			// Otherwise, ensure progress exists
			if (!useDataStore.getState().currentSentenceProgress) {
				initializeSentenceProgress?.()
			}
			await new Promise((r) => setTimeout(r, 0))
			guard++
			continue
		}
		const entry = sentenceObj.data[next.index]
		const answers = expectedAnswers(entry)
		if (!answers || answers.length === 0) {
			// Non-interactive section; mark as translated and continue
			useDataStore.getState().setSectionTranslated?.(next.index, true)
			await new Promise((r) => setTimeout(r, 0))
			guard++
			continue
		}
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

/**
 * Simulate a lesson with targeted verb errors:
 * For sections whose expected answer contains a verb, submit an incorrect verb according to a cycling strategy,
 * then submit the correct answer. For non-verb sections, fall back to generic wrong+right.
 */
export async function simulateLessonVerbMistakes() {
	if (!useDataStore.getState().currentSentenceProgress) {
		useDataStore.getState().initializeSentenceProgress?.()
		await new Promise((r) => setTimeout(r, 0))
	}
	let guard = 0
	const isLessonComplete = useDataStore.getState().isLessonComplete
	const initializeSentenceProgress =
		useDataStore.getState().initializeSentenceProgress
	const strategies: WrongVerbStrategy[] = ["conjugation", "tense", "ser-estar"]
	let stratIndex = 0

	while (!isLessonComplete?.() && guard < 10000) {
		const state = useDataStore.getState()
		const lesson = state.lessons[state.currentLessonIndex]
		const sentenceObj = lesson.sentences?.[state.currentSentenceIndex]
		const sections = state.currentSentenceProgress?.translationSections ?? []
		const next = sections.find((s) => !s.isTranslated)
		if (!sentenceObj) break
		if (!next) {
			const rawSectionCount = Array.isArray(sentenceObj.data)
				? sentenceObj.data.filter((e: unknown) => {
						if (!e || typeof e !== "object") return false
						return "translation" in (e as Record<string, unknown>)
				  }).length
				: 0
			if (rawSectionCount === 0 || sections.every((s) => s.isTranslated)) {
				useDataStore.getState().nextSentence()
				await new Promise((r) => setTimeout(r, 0))
				guard++
				continue
			}
			if (!useDataStore.getState().currentSentenceProgress) {
				initializeSentenceProgress?.()
			}
			await new Promise((r) => setTimeout(r, 0))
			guard++
			continue
		}
		const entry = sentenceObj.data[next.index]
		const answers = expectedAnswers(entry)
		if (!answers || answers.length === 0) {
			useDataStore.getState().setSectionTranslated?.(next.index, true)
			await new Promise((r) => setTimeout(r, 0))
			guard++
			continue
		}
		const correctAns = answers[0] ?? "si"

		// Try targeted verb error
		const expectedVerb = resolveExpectedVerb(entry)
		let wrong = "__wrong__"
		if (expectedVerb) {
			// rotate strategy across sections
			const strat = strategies[stratIndex % strategies.length]
			stratIndex++
			const alt = pickAlternativeVerb(expectedVerb, strat)
			if (alt && alt !== correctAns) wrong = alt
		}

		useDataStore.getState().checkCurrentAnswer(wrong)
		await new Promise((r) => setTimeout(r, 0))
		useDataStore.getState().checkCurrentAnswer(correctAns)
		await new Promise((r) => setTimeout(r, 0))
		guard++
	}

	try {
		if (isLessonComplete?.()) {
			if (typeof window !== "undefined") {
				window.dispatchEvent(new Event("openLessonSummary"))
			}
		}
	} catch {}
}
