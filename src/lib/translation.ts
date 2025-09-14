import type { SentenceDataEntry, WordObject } from "@/data/types"
import { normalizeText } from "@/lib/text"

export function isWordObject(val: unknown): val is WordObject {
	return (
		typeof val === "object" &&
		val !== null &&
		"word" in (val as Record<string, unknown>) &&
		typeof (val as { word: unknown }).word === "string"
	)
}

// Build a Spanish-only target string from translation
export function spanishTarget(entry: SentenceDataEntry): string | null {
	const t = (entry as { translation?: unknown }).translation
	if (!t) return null
	if (typeof t === "string") return t
	if (isWordObject(t)) return t.word
	if (Array.isArray(t)) {
		const parts: string[] = []
		for (const item of t) {
			if (typeof item === "string") parts.push(item)
			else if (isWordObject(item)) parts.push(item.word)
		}
		return parts.length ? parts.join(" ") : null
	}
	return null
}

export function spanishWordCount(entry: SentenceDataEntry): number {
	// If the entry includes explicit references mapping translation ids to
	// phrase positions, use that to count occurrences (handles repeated words).
	const ref = (
		entry as { reference?: Record<string, (number | string)[] | undefined> }
	).reference
	if (ref && typeof ref === "object") {
		let total = 0
		for (const v of Object.values(ref)) {
			if (Array.isArray(v)) total += v.length
		}
		if (total > 0) return total
	}

	const t = (entry as { translation?: unknown }).translation
	if (!t) return 0
	if (typeof t === "string") return t.trim().split(/\s+/).filter(Boolean).length
	if (isWordObject(t)) return 1
	if (Array.isArray(t)) {
		return t.reduce(
			(acc, item) =>
				acc +
				(isWordObject(item)
					? 1
					: typeof item === "string"
					? item.trim().split(/\s+/).filter(Boolean).length
					: 0),
			0
		)
	}
	return 0
}

export function expectedAnswers(entry: SentenceDataEntry): string[] {
	// If a phraseTranslation exists, it takes priority for matching
	const pt = (entry as { phraseTranslation?: unknown }).phraseTranslation
	if (typeof pt === "string") return [normalizeText(pt)]
	if (Array.isArray(pt))
		return Array.from(
			new Set(
				pt.filter((s): s is string => typeof s === "string").map(normalizeText)
			)
		)

	// Morphological control flags
	const expectedForm = (entry as { expectedForm?: string }).expectedForm
	const allowForms = (entry as { allowForms?: boolean }).allowForms
	const pluralRequired = (entry as { plural?: boolean }).plural

	const target = spanishTarget(entry)
	const answers: string[] = []
	if (target) answers.push(normalizeText(target))

	// If translation is a WordObject or array of them, collect their forms
	const t = (entry as { translation?: unknown }).translation
	const addForms = (w: WordObject) => {
		if (w.forms) for (const f of w.forms) answers.push(normalizeText(f))
	}
	if (t && typeof t === "object") {
		if (isWordObject(t)) addForms(t)
		else if (Array.isArray(t))
			for (const item of t) if (isWordObject(item)) addForms(item)
	}

	// If a specific expectedForm is set, override and require only that form
	if (expectedForm) return [normalizeText(expectedForm)]

	// If plural flag set, filter to plural candidates only. Heuristic: any form present in forms[] not equal to base word; if multiple, all acceptable.
	if (pluralRequired) {
		// Base word assumed singular; forms[] may contain plurals. Collect only those that differ from base.
		const base = answers.length ? answers[0] : null
		const pluralForms = answers.filter((a) => a !== base)
		if (pluralForms.length) return Array.from(new Set(pluralForms))
		// Fallback: if no distinct plural found, still return base to avoid empty acceptable set
		return base ? [base] : []
	}

	// If allowForms flagged, return unique set. Otherwise restrict to the base word only
	if (allowForms) return Array.from(new Set(answers))

	// No forms allowed: keep only the first (base target) if present
	return answers.length ? [answers[0]] : []
}
