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

	const target = spanishTarget(entry)
	return target ? [normalizeText(target)] : []
}
