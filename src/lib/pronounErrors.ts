import spanishWords from "@/data/spanishWords"
import type {
	SentenceDataEntry,
	WordObject,
	PronounGroup,
	AdjectiveGroup,
	WordGroup,
} from "@/data/types"
import { expectedAnswers, isWordObject } from "@/lib/translation"
import { normalizeText } from "@/lib/text"

export type PronounCategory = "subject" | "dObj" | "possessive"

export type PronSurfaceInfo = {
	surface: string
	category: PronounCategory
	person?: string
}

function addWordGroupToIndex(
	index: Record<string, PronSurfaceInfo>,
	group: WordGroup | undefined,
	category: PronounCategory
) {
	if (!group?.words) return
	for (const w of Object.values(group.words)) {
		if (!w || typeof w !== "object") continue
		if (w.word)
			index[normalizeText(w.word)] = {
				surface: w.word,
				category,
				person: w.person,
			}
		if (Array.isArray(w.forms)) {
			for (const f of w.forms)
				index[normalizeText(f)] = { surface: f, category, person: w.person }
		}
	}
}

function buildPronounIndex(): Record<string, PronSurfaceInfo> {
	const index: Record<string, PronSurfaceInfo> = {}
	const pg = (spanishWords as unknown as { pron?: PronounGroup }).pron
	const ag = (spanishWords as unknown as { adjective?: AdjectiveGroup })
		.adjective
	if (pg) {
		addWordGroupToIndex(index, pg.subject, "subject")
		addWordGroupToIndex(index, pg.dObj, "dObj")
	}
	if (ag) {
		addWordGroupToIndex(index, ag.possessive, "possessive")
	}
	return index
}

const PRON_INDEX: Record<string, PronSurfaceInfo> = buildPronounIndex()

function lookupPronInFreeText(input: string): PronSurfaceInfo | undefined {
	const direct = PRON_INDEX[normalizeText(input)]
	if (direct) return direct
	const tokens = normalizeText(input)
		.split(/\s+/)
		.map((t) => t.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, ""))
		.filter(Boolean)
	for (const t of tokens) {
		const vi = PRON_INDEX[t]
		if (vi) return vi
	}
	return undefined
}

function collectPronExpectedSurfaces(entry: SentenceDataEntry): string[] {
	const t = (entry as { translation?: unknown }).translation
	const surfaces: string[] = []
	if (!t) return surfaces
	if (typeof t === "string") return surfaces
	const pushCandidate = (w: WordObject) => {
		if (!w || typeof w !== "object") return
		if (w.word) surfaces.push(w.word)
		if (Array.isArray(w.forms)) for (const f of w.forms) surfaces.push(f)
	}
	if (isWordObject(t)) pushCandidate(t)
	else if (Array.isArray(t))
		for (const it of t) if (isWordObject(it)) pushCandidate(it)
	return surfaces
}

export type PronounErrorTag =
	| "pron.error.category" // subject vs dObj vs possessive
	| "pron.error.person" // wrong person (I/you/he/she/we/they)

export function classifyPronounMistake(
	entry: SentenceDataEntry,
	wrongInput: string
): PronounErrorTag[] {
	const tags: PronounErrorTag[] = []
	const wrongInfo = lookupPronInFreeText(wrongInput)
	if (!wrongInfo) return tags

	const expAnswers = expectedAnswers(entry)
	const expPronCandidates = expAnswers
		.map((e) => PRON_INDEX[normalizeText(e)])
		.filter((v): v is PronSurfaceInfo => !!v)

	let expected: PronSurfaceInfo | undefined = expPronCandidates[0]
	if (!expected) {
		const surfaces = collectPronExpectedSurfaces(entry)
		for (const s of surfaces) {
			const vi = PRON_INDEX[normalizeText(s)]
			if (vi) {
				expected = vi
				break
			}
		}
	}
	if (!expected) return tags

	if (wrongInfo.category !== expected.category) tags.push("pron.error.category")
	if (
		wrongInfo.person &&
		expected.person &&
		wrongInfo.person !== expected.person
	)
		tags.push("pron.error.person")

	return Array.from(new Set(tags))
}

export type PronounFeedbackItem = {
	tag: PronounErrorTag
	title: string
	details?: string[]
	wrong?: PronSurfaceInfo
	expected?: PronSurfaceInfo
}

function titleForTag(tag: PronounErrorTag): string {
	if (tag === "pron.error.category")
		return "Wrong category (subject/d.o./possessive)"
	if (tag === "pron.error.person") return "Wrong person (I/you/he/she/we/they)"
	return tag
}

export function getPronounFeedback(
	entry: SentenceDataEntry,
	wrongInput: string
): PronounFeedbackItem[] {
	const wrong = lookupPronInFreeText(wrongInput)
	if (!wrong) return []

	const expAnswers = expectedAnswers(entry)
	const expPronCandidates = expAnswers
		.map((e) => PRON_INDEX[normalizeText(e)])
		.filter((v): v is PronSurfaceInfo => !!v)

	let expected: PronSurfaceInfo | undefined = expPronCandidates[0]
	if (!expected) {
		const surfaces = collectPronExpectedSurfaces(entry)
		for (const s of surfaces) {
			const vi = PRON_INDEX[normalizeText(s)]
			if (vi) {
				expected = vi
				break
			}
		}
	}
	if (!expected) return []

	const tags = classifyPronounMistake(entry, wrongInput)
	if (tags.length === 0) return []

	const items: PronounFeedbackItem[] = []
	for (const tag of tags) {
		const title = titleForTag(tag)
		const details: string[] = []
		const usedDesc = [wrong.surface, wrong.category, wrong.person]
			.filter(Boolean)
			.join(" — ")
		const expDesc = [expected.surface, expected.category, expected.person]
			.filter(Boolean)
			.join(" — ")

		if (tag === "pron.error.category") {
			details.push(`You used ${usedDesc}; expected ${expDesc}.`)
			details.push(
				"Ensure you're using the correct category: subject pronoun (yo/tú/él...), direct object pronoun (lo/la/los/las...), or possessive (mi/tu/su/nuestro...)."
			)
		} else if (tag === "pron.error.person") {
			details.push(`You used ${usedDesc}; expected ${expDesc}.`)
			details.push(
				"Match the person with the sentence's subject or ownership: first (I/we), second (you), third (he/she/they)."
			)
		}

		items.push({ tag, title, details, wrong, expected })
	}
	return items
}
