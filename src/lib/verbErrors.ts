import spanishWords from "@/data/spanishWords"
import type {
	SentenceDataEntry,
	WordObject,
	VerbGroup,
	VerbRoot,
	VerbConjugation,
} from "@/data/types"
import { expectedAnswers, isWordObject } from "@/lib/translation"
import { normalizeText } from "@/lib/text"

export type VerbSurfaceInfo = {
	surface: string
	root: string // e.g., "ser", "estar"
	tense?: string
	person?: string
}

// Build a map of normalized surface -> verb metadata for quick lookup
function buildVerbIndex(): Record<string, VerbSurfaceInfo> {
	const index: Record<string, VerbSurfaceInfo> = {}
	const vg = spanishWords.verb as unknown as VerbGroup
	if (!vg || !vg.words) return index
	const words = vg.words as Record<string, VerbRoot>
	for (const [rootKey, root] of Object.entries(words)) {
		// root word itself (infinitive). We record, but it's not a conjugation.
		if (root.word) {
			index[normalizeText(root.word)] = {
				surface: root.word,
				root: rootKey,
			}
		}
		// Iterate all known tense buckets on the root and index their conjugations
		const buckets: Array<keyof VerbRoot> = [
			"present",
			"past",
			"preterite",
			"future",
			"conditional",
			"subjunctive",
			"participle",
			"gerund",
		]
		for (const bucket of buckets) {
			const group = (root as unknown as Record<string, unknown>)[
				bucket as string
			] as Record<string, VerbConjugation> | undefined
			if (!group) continue
			for (const conj of Object.values(group) as VerbConjugation[]) {
				const s = conj.word
				if (!s) continue
				// Prefer explicit tense on each conjugation; fallback to bucket name
				const fallbackTense =
					bucket === "present"
						? "Present"
						: bucket === "past"
						? "Past"
						: bucket === "preterite"
						? "Preterite"
						: bucket === "future"
						? "Future"
						: bucket === "conditional"
						? "Conditional"
						: bucket === "subjunctive"
						? "Subjunctive"
						: bucket === "participle"
						? "Participle"
						: bucket === "gerund"
						? "Gerund"
						: undefined
				index[normalizeText(s)] = {
					surface: s,
					root: rootKey,
					tense: conj.tense || fallbackTense,
					person: conj.person,
				}
			}
		}
	}
	return index
}

const VERB_INDEX: Record<string, VerbSurfaceInfo> = buildVerbIndex()

function lookupVerbInFreeText(input: string): VerbSurfaceInfo | undefined {
	const direct = VERB_INDEX[normalizeText(input)]
	if (direct) return direct
	const tokens = normalizeText(input)
		.split(/\s+/)
		.map((t) => t.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, ""))
		.filter(Boolean)
	for (const t of tokens) {
		const vi = VERB_INDEX[t]
		if (vi) return vi
	}
	return undefined
}

function collectVerbExpectedSurfaces(entry: SentenceDataEntry): string[] {
	const t = (entry as { translation?: unknown }).translation
	const surfaces: string[] = []
	if (!t) return surfaces
	if (typeof t === "string") return surfaces
	const pushIfVerb = (w: WordObject) => {
		if (typeof w !== "object" || !w) return
		if ((w.pos || "").toLowerCase().includes("verb")) {
			if (w.word) surfaces.push(w.word)
			if (Array.isArray(w.forms)) {
				for (const f of w.forms) if (typeof f === "string") surfaces.push(f)
			}
		}
	}
	if (isWordObject(t)) pushIfVerb(t)
	else if (Array.isArray(t)) {
		for (const item of t) if (isWordObject(item)) pushIfVerb(item)
	}
	return surfaces
}

export type VerbErrorTag =
	| "verb.error.conjugation" // wrong person/number
	| "verb.error.tense" // wrong tense (e.g., present vs past)
	| "verb.error.ser-vs-estar" // wrong be-verb root
	| "verb.error.wrong-root" // other verb root mismatch

/**
 * Classify verb-related mistakes when a section expects a verb and the user's
 * wrong input is also a recognizable verb surface.
 * Returns zero or more high-level tags capturing the type(s) of mismatch.
 */
export function classifyVerbMistake(
	entry: SentenceDataEntry,
	wrongInput: string
): VerbErrorTag[] {
	const tags: VerbErrorTag[] = []
	const wrongInfo = lookupVerbInFreeText(wrongInput)
	if (!wrongInfo) return tags // user's wrong input not recognized as a verb

	// Confirm the section expects a verb by checking expected answers and/or translation objects
	const expAnswers = expectedAnswers(entry)
	// Prefer expected forms that are verbs according to our index
	const expVerbCandidates = expAnswers
		.map((e) => VERB_INDEX[normalizeText(e)])
		.filter((v): v is VerbSurfaceInfo => !!v)

	// Fallback to translation objects (in case expectedAnswers are English phrases etc.)
	let resolvedExpected: VerbSurfaceInfo | undefined = expVerbCandidates[0]
	if (!resolvedExpected) {
		const surfaces = collectVerbExpectedSurfaces(entry)
		for (const s of surfaces) {
			const vi = VERB_INDEX[normalizeText(s)]
			if (vi) {
				resolvedExpected = vi
				break
			}
		}
	}

	if (!resolvedExpected) return tags // section likely not strictly a verb surface

	// Compare root first (e.g., ser vs estar)
	if (wrongInfo.root !== resolvedExpected.root) {
		const beSet = new Set(["ser", "estar"])
		if (beSet.has(wrongInfo.root) && beSet.has(resolvedExpected.root)) {
			tags.push("verb.error.ser-vs-estar")
		} else {
			tags.push("verb.error.wrong-root")
		}
	}

	// Compare tense (if both known)
	if (
		wrongInfo.tense &&
		resolvedExpected.tense &&
		wrongInfo.tense !== resolvedExpected.tense
	) {
		tags.push("verb.error.tense")
	}

	// Compare person (if both known)
	if (
		wrongInfo.person &&
		resolvedExpected.person &&
		wrongInfo.person !== resolvedExpected.person
	) {
		tags.push("verb.error.conjugation")
	}

	return Array.from(new Set(tags))
}

// ---------------------------------------------------------------------------
// Rich feedback helpers
// ---------------------------------------------------------------------------

export type VerbFeedbackItem = {
	tag: VerbErrorTag
	title: string
	details?: string[]
	wrong?: VerbSurfaceInfo
	expected?: VerbSurfaceInfo
}

function titleForTag(tag: VerbErrorTag): string {
	if (tag === "verb.error.conjugation")
		return "Wrong conjugation (person/number)"
	if (tag === "verb.error.tense") return "Wrong verb tense"
	if (tag === "verb.error.ser-vs-estar") return "Ser vs Estar mixup"
	if (tag === "verb.error.wrong-root") return "Wrong verb (different root)"
	return tag
}

function prettyPerson(p?: string): string | undefined {
	if (!p) return undefined
	// Capitalize first letter(s)
	return p
		.split(/\s+/)
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(" ")
}

/**
 * Produce detailed, user-friendly feedback items for a wrong input.
 * Includes which form was used vs expected, and explanatory hints when applicable.
 */
export function getVerbFeedback(
	entry: SentenceDataEntry,
	wrongInput: string
): VerbFeedbackItem[] {
	const wrong = lookupVerbInFreeText(wrongInput)
	if (!wrong) return []

	const expAnswers = expectedAnswers(entry)
	const expVerbCandidates = expAnswers
		.map((e) => VERB_INDEX[normalizeText(e)])
		.filter((v): v is VerbSurfaceInfo => !!v)

	let expected: VerbSurfaceInfo | undefined = expVerbCandidates[0]
	if (!expected) {
		const surfaces = collectVerbExpectedSurfaces(entry)
		for (const s of surfaces) {
			const vi = VERB_INDEX[normalizeText(s)]
			if (vi) {
				expected = vi
				break
			}
		}
	}
	if (!expected) return []

	const tags = classifyVerbMistake(entry, wrongInput)
	if (tags.length === 0) return []

	const items: VerbFeedbackItem[] = []
	for (const tag of tags) {
		const title = titleForTag(tag)
		const details: string[] = []
		// Common "used vs expected" line only when it doesn't reveal English parts
		const usedDesc = [wrong.surface, wrong.root].filter(Boolean).join(" — ")
		const expDesc = [expected.surface, expected.root]
			.filter(Boolean)
			.join(" — ")

		if (tag === "verb.error.conjugation") {
			const usedParts = [
				wrong.surface,
				wrong.root,
				wrong.tense ? wrong.tense : undefined,
				prettyPerson(wrong.person),
			].filter(Boolean)
			const expParts = [
				expected.surface,
				expected.root,
				expected.tense ? expected.tense : undefined,
				prettyPerson(expected.person),
			].filter(Boolean)
			details.push(
				`You used ${usedParts.join(" — ")}; expected ${expParts.join(" — ")}.`
			)
			details.push(
				"Conjugations must match the sentence's subject (I/you/he/she/we/they)."
			)
		} else if (tag === "verb.error.tense") {
			details.push(
				`You used ${usedDesc} (${
					wrong.tense || "unknown"
				}); expected ${expDesc} (${expected.tense || "unknown"}).`
			)
			details.push("Ensure the tense (Present/Past/etc.) matches the context.")
		} else if (tag === "verb.error.ser-vs-estar") {
			details.push(`You used ${usedDesc}; expected ${expDesc}.`)
			details.push(
				"Use SER for identity/essence (what something is). Use ESTAR for states/locations (how/where)."
			)
		} else if (tag === "verb.error.wrong-root") {
			details.push(`You used ${usedDesc}; expected ${expDesc}.`)
			details.push(
				"This is a different verb. Choose the correct root verb for the meaning."
			)
		}

		items.push({ tag, title, details, wrong, expected })
	}
	return items
}

// ---------------------------------------------------------------------------
// Exposed helpers for simulation and utilities
// ---------------------------------------------------------------------------

/** Resolve the expected verb (root/tense/person) for a section, if any. */
export function resolveExpectedVerb(
	entry: SentenceDataEntry
): VerbSurfaceInfo | undefined {
	const expAnswers = expectedAnswers(entry)
	const expVerbCandidates = expAnswers
		.map((e) => VERB_INDEX[normalizeText(e)])
		.filter((v): v is VerbSurfaceInfo => !!v)

	let expected: VerbSurfaceInfo | undefined = expVerbCandidates[0]
	if (!expected) {
		const surfaces = collectVerbExpectedSurfaces(entry)
		for (const s of surfaces) {
			const vi = VERB_INDEX[normalizeText(s)]
			if (vi) {
				expected = vi
				break
			}
		}
	}
	return expected
}

/** Return all conjugation surfaces for a root grouped by tense. */
export function getVerbFormsByRoot(
	root: string
): Record<string, VerbSurfaceInfo[]> {
	const out: Record<string, VerbSurfaceInfo[]> = {}
	const vg = spanishWords.verb as unknown as VerbGroup
	const words = (vg?.words || {}) as Record<string, VerbRoot>
	const r = words[root]
	if (!r) return out
	const buckets: Array<keyof VerbRoot> = [
		"present",
		"past",
		"preterite",
		"future",
		"conditional",
		"subjunctive",
		"participle",
		"gerund",
	]
	for (const bucket of buckets) {
		const group = (r as unknown as Record<string, unknown>)[
			bucket as string
		] as Record<string, VerbConjugation> | undefined
		if (!group) continue
		for (const conj of Object.values(group) as VerbConjugation[]) {
			if (!conj?.word) continue
			const fallbackTense =
				bucket === "present"
					? "Present"
					: bucket === "past"
					? "Past"
					: bucket === "preterite"
					? "Preterite"
					: bucket === "future"
					? "Future"
					: bucket === "conditional"
					? "Conditional"
					: bucket === "subjunctive"
					? "Subjunctive"
					: bucket === "participle"
					? "Participle"
					: bucket === "gerund"
					? "Gerund"
					: undefined
			if (!out[fallbackTense || conj.tense || bucket])
				out[fallbackTense || conj.tense || (bucket as string)] = []
			out[fallbackTense || conj.tense || (bucket as string)].push({
				surface: conj.word,
				root,
				tense: conj.tense || fallbackTense,
				person: conj.person,
			})
		}
	}
	return out
}

function personMatches(a?: string, b?: string) {
	if (!a || !b) return false
	const A = a.toLowerCase()
	const B = b.toLowerCase()
	if (A === B) return true
	// allow data like "first/third"
	return A.includes(B) || B.includes(A)
}

export type WrongVerbStrategy = "conjugation" | "tense" | "ser-estar"

/** Pick a wrong conjugation surface based on a strategy. Returns the surface text. */
export function pickAlternativeVerb(
	expected: VerbSurfaceInfo,
	strategy: WrongVerbStrategy
): string | undefined {
	const forms = getVerbFormsByRoot(expected.root)
	const allBuckets = Object.keys(forms)
	const expectedTenseKey = expected.tense || ""
	const expectedBucketKey =
		allBuckets.find(
			(k) => k.toLowerCase() === expectedTenseKey.toLowerCase()
		) || expectedTenseKey
	const allFormsFlat = allBuckets.flatMap((k) => forms[k] ?? [])

	if (strategy === "conjugation") {
		const pool = (forms[expectedBucketKey] || []).filter(
			(f) => f.surface !== expected.surface
		)
		// Prefer same tense, different person
		const sameTenseDifferentPerson = pool.filter(
			(f) => !personMatches(f.person, expected.person)
		)
		const choice = (sameTenseDifferentPerson[0] || pool[0])?.surface
		if (choice) return choice
	}

	if (strategy === "tense") {
		// Prefer same person in any other tense bucket
		const otherBuckets = allBuckets.filter((k) => k !== expectedBucketKey)
		for (const b of otherBuckets) {
			const samePerson = (forms[b] || []).find((f) =>
				personMatches(f.person, expected.person)
			)
			if (samePerson) return samePerson.surface
		}
		// Otherwise first available from a different tense
		for (const b of otherBuckets) {
			const f = (forms[b] || [])[0]
			if (f) return f.surface
		}
	}

	if (strategy === "ser-estar") {
		const targetRoot =
			expected.root === "ser"
				? "estar"
				: expected.root === "estar"
				? "ser"
				: undefined
		if (targetRoot) {
			const alt = getVerbFormsByRoot(targetRoot)
			const altBuckets = Object.keys(alt)
			const pool = altBuckets.flatMap((k) => alt[k] ?? [])
			// Prefer same tense + person if available
			const pref = pool.find(
				(f) =>
					(f.tense || "").toLowerCase() === expected.tense?.toLowerCase() &&
					personMatches(f.person, expected.person)
			)
			if (pref) return pref.surface
			if (pool[0]) return pool[0].surface
		}
	}

	// Fallback: pick any different form within root, then any ser/estar form
	const anyDifferent = allFormsFlat.find((f) => f.surface !== expected.surface)
	if (anyDifferent) return anyDifferent.surface
	const serAlt = getVerbFormsByRoot("ser")
	const estarAlt = getVerbFormsByRoot("estar")
	const anyBe = [
		...Object.keys(serAlt).flatMap((k) => serAlt[k] ?? []),
		...Object.keys(estarAlt).flatMap((k) => estarAlt[k] ?? []),
	][0]
	return anyBe?.surface
}
