import { WordObject } from "@/data/types"
import { normalizeText } from "@/lib/text"

/** Derive a default plural guess for regular nouns (best-effort, not exhaustive). */
function derivePlural(base: string): string {
	if (base.endsWith("z")) return base.slice(0, -1) + "ces" // luz -> luces
	if (/[^aeiou]ión$/.test(base)) return base.replace(/ión$/, "iones")
	if (/[aeiou]$/.test(base)) return base + "s"
	return base + "es"
}

export interface AsPluralOptions {
	/** Provide a specific plural override (e.g., for irregulars like lápiz->lápices) */
	override?: string
	/** If true and no plural found/derivable, throw (dev safety). Default: false */
	strict?: boolean
}

/**
 * Create an exact plural surface variant of a WordObject without mutating the original.
 * - Prefers first item in `forms` if present.
 * - Otherwise attempts derivation (basic Spanish patterns).
 * - You can override with options.override.
 * The returned object keeps the same id (analytics grouped) but you could suffix if desired.
 */
export function asPlural(
	base: WordObject,
	opts: AsPluralOptions = {}
): WordObject {
	const override = opts.override?.trim()
	const candidates = Array.isArray(base.forms) ? base.forms : []
	const inferred = override || candidates[0] || derivePlural(base.word)
	if (!inferred || inferred === base.word) {
		if (opts.strict) {
			throw new Error(
				`Cannot determine plural form for '${base.word}'. Provide forms[] or override.`
			)
		}
		// Return original (will behave singular) if we failed to get a distinct plural
		return base
	}
	return {
		...base,
		word: inferred,
		// Mark exact form so future logic could (optionally) treat it as fixed
		exactForm: inferred,
		// Keep existing forms—do NOT filter them; answer logic stays consistent
	}
}

/** Utility to check if user supplied plural vs singular (basic heuristic). */
export function isPluralSurface(word: string, singular: string): boolean {
	const nWord = normalizeText(word)
	const nSing = normalizeText(singular)
	return nWord !== nSing && (nWord.endsWith("s") || nWord.endsWith("es"))
}
