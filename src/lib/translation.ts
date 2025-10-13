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
		// Only count reference entries that appear to correspond to the
		// translation word objects for this entry. Some entries include
		// pedagogical references (unrelated topics) which should not affect
		// the expected word count.
		const t = (entry as { translation?: unknown }).translation
		const translationWordIds: string[] = []

		if (isWordObject(t) && typeof t.id === "string") {
			translationWordIds.push(t.id)
		} else if (Array.isArray(t)) {
			for (const item of t) {
				if (isWordObject(item) && typeof item.id === "string")
					translationWordIds.push(item.id)
			}
		}

		// Helper to decide whether a reference key likely maps to a translated
		// word object id. We compare the prefix/group and the specific word
		// segment (e.g., 'verb' and 'estar' in 'verb.estar.subjunctive.estemos')
		// against the reference path (e.g., 'verb.words.estar'). This is a
		// heuristic but works for the project's naming conventions.
		const refKeyMatchesId = (key: string, id: string) => {
			const keyParts = key.split(".")
			const idParts = id.split(".")
			if (!keyParts.length || !idParts.length) return false
			// Require same top-level group (e.g., 'verb')
			if (keyParts[0] !== idParts[0]) return false
			// Also require the key to include the second id segment (the word name)
			// e.g., 'estar' must appear in the ref key like 'verb.words.estar'
			return idParts.length > 1 && keyParts.includes(idParts[1])
		}

		let total = 0
		if (translationWordIds.length > 0) {
			for (const [k, v] of Object.entries(ref)) {
				if (!Array.isArray(v)) continue
				// Count this ref only if it appears to match any translated word id
				if (translationWordIds.some((id) => refKeyMatchesId(k, id))) {
					total += v.length
				}
			}
			if (total > 0) return total
		} else {
			// No word objects in translation: fall back to conservative behavior
			// and ignore reference-based totals to avoid counting unrelated refs.
		}
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

	// General handling: adjective placement flexibility using adjPlacement and apocope metadata on WordObject.
	// If translation is an array like [article?, noun, adjective] or [article?, adjective, noun] and the adjective has adjPlacement 'both' or 'before',
	// generate order variants with appropriate surface (apocopeBeforeMascSing when applicable).
	let flexVariantsAdded = false
	try {
		if (Array.isArray(t)) {
			const items = t.filter(
				(x): x is WordObject | string =>
					typeof x === "string" || isWordObject(x)
			)
			const article = items.find(
				(x) => isWordObject(x) && (x.id?.startsWith("artcl.") ?? false)
			) as WordObject | undefined
			const noun = items.find(
				(x) => isWordObject(x) && (x.id?.startsWith("noun.") ?? false)
			) as WordObject | undefined
			const adj = items.find(
				(x) => isWordObject(x) && x.pos?.toLowerCase() === "adjective"
			) as WordObject | undefined

			if (adj && noun) {
				const placement = (adj.adjPlacement || "after") as
					| "before"
					| "after"
					| "both"
				const allowBefore = placement === "before" || placement === "both"
				const allowAfter = placement === "after" || placement === "both"
				const artWord = article?.word?.toLowerCase()
				const nounGender = (noun.gender || "").toLowerCase()
				// Prefer noun gender; fall back to article only if gender is missing
				const isMasc = nounGender
					? nounGender.startsWith("m")
					: artWord === "el" || artWord === "los" || artWord === "un"
				const isPlural = artWord === "los" || artWord === "las"
				// Determine adjective surface after noun: use base word or plural forms heuristically if they exist
				let adjAfter = adj.word
				if (isPlural && Array.isArray(adj.forms)) {
					// prefer plural-specific form matching gender if present
					const mascPl = adj.forms.find((f) => f.toLowerCase().endsWith("os"))
					const femPl = adj.forms.find((f) => f.toLowerCase().endsWith("as"))
					adjAfter = isMasc ? mascPl || adjAfter : femPl || adjAfter
				} else if (!isPlural && Array.isArray(adj.forms)) {
					// prefer feminine singular if noun is feminine and base is masculine variant
					if (!isMasc) {
						const femSg = adj.forms.find((f) => f.toLowerCase().endsWith("a"))
						if (femSg) adjAfter = femSg
					}
				}
				// Determine adjective surface before noun (apocope if masc sg and provided)
				let adjBefore = adjAfter
				if (!isPlural && isMasc && adj.apocopeBeforeMascSing) {
					adjBefore = adj.apocopeBeforeMascSing
				}

				const artSurface = article ? article.word : undefined
				const nounSurface = noun.word
				if (nounSurface) {
					// After-noun order if allowed
					if (allowAfter) {
						const optionAfter = [artSurface, nounSurface, adjAfter]
							.filter(Boolean)
							.join(" ")
						answers.push(normalizeText(optionAfter))
					}
					// Before-noun order if allowed
					if (allowBefore) {
						const optionBefore = [artSurface, adjBefore, nounSurface]
							.filter(Boolean)
							.join(" ")
						answers.push(normalizeText(optionBefore))
					}
					flexVariantsAdded = true
				}
			}
		}
	} catch {
		// ignore flexibility generation errors
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

	// If we generated flexible phrase variants (e.g., adjective placement), accept all unique variants regardless of allowForms.
	if (flexVariantsAdded) {
		const uniq = Array.from(new Set(answers))
		// Keep only multi-token phrase candidates to avoid stray single-word forms
		return uniq.filter((s) => /\s/.test(s))
	}

	// If allowForms flagged, return unique set. Otherwise restrict to the base word only
	if (allowForms) return Array.from(new Set(answers))

	// No forms allowed: keep only the first (base target) if present
	return answers.length ? [answers[0]] : []
}
