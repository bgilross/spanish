export interface Lesson {
	lesson: number
	name: string
	details: string
	info: string[]
	wordBank?: WordObject[]
	sentences?: Sentence[]
}

// ---------------------------------------------------------------------------
// Core lesson + sentence structures
// ---------------------------------------------------------------------------
export interface Lesson {
	lesson: number
	name: string
	details: string
	info: string[]
	wordBank?: WordObject[]
	sentences?: Sentence[]
}

export interface Sentence {
	id: number
	sentence: string
	translation: string
	data: SentenceDataEntry[]
	/** @deprecated legacy whole-sentence flag; prefer per-entry noPronoun */
	noPronoun?: boolean
	/** Optional flag indicating this sentence/section should be translated in the formal register */
	isFormal?: boolean
}

// ---------------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------------
export interface WordObject {
	id: string
	word: string
	translations: string[]
	pos: string
	gender?: string
	tense?: string
	person?: string
	audio?: string
	info: string[]
	/** Optional acceptable surface variants (e.g. plurals) */
	forms?: string[]
	/** If set, treat this object as a fixed surface (e.g. cloned plural form) */
	exactForm?: string
	/** For adjectives: where can it occur relative to a noun? 'before', 'after', or 'both' */
	adjPlacement?: "before" | "after" | "both"
	/** For adjectives: apocope surface to use before masculine singular nouns (e.g., 'bueno' -> 'buen') */
	apocopeBeforeMascSing?: string
}

// ---------------------------------------------------------------------------
// Sentence data entries (union allowing optional phraseTranslation or raw translation)
// ---------------------------------------------------------------------------
export type SentenceDataEntry =
	| {
			phrase: string
			translation?: WordObject | string
			mixup?: WordObject | WordObject[]
			noPronoun?: boolean
			expectedForm?: string
			allowForms?: boolean
			plural?: boolean
	  }
	| {
			phrase: string
			phraseTranslation?: string | string[]
			translation: WordObject | WordObject[] | string
			reference?: Record<string, (number | string)[]>
			mixup?: WordObject
			noPronoun?: boolean
			isFormal?: boolean
			expectedForm?: string
			allowForms?: boolean
			plural?: boolean
	  }

// ---------------------------------------------------------------------------
// Group Types
// ---------------------------------------------------------------------------
export type WordGroup = {
	id: string
	name: string
	info: string[]
	words: Record<string, WordObject>
}

/** Adjectives can have subcategories like possessive or descriptive. Possessive
 * adjectives frequently have plural surface forms (e.g. mi -> mis, nuestro -> nuestros)
 */
export type AdjectiveGroup = {
	id: string
	name: string
	info: string[]
	/** Generic adjective bucket (keeps backward compatibility) */
	words: Record<string, WordObject>
	/** Named adjective subcategories (possessive, descriptive, etc.) */
	possessive: WordGroup
	descriptive: WordGroup
}

export type PronounGroup = {
	id: string
	name: string
	info: string[]
	words: Record<string, WordObject>
	demonstrative: WordGroup
	interrogative: WordGroup
	subject: WordGroup
	dObj: WordGroup
	attribute: WordGroup
}

export interface VerbConjugation extends WordObject {
	info: string[]
	tense: string
	person: string
}

export interface VerbRoot extends WordObject {
	info: string[]
	present: Record<string, VerbConjugation>
	past: Record<string, VerbConjugation>
	subjunctive: Record<string, VerbConjugation>
	preterite: Record<string, VerbConjugation>
}

export interface VerbGroup {
	id: string
	name: string
	info: string[]
	words: Record<string, VerbRoot>
}

// ---------------------------------------------------------------------------
// Translation helpers + analytics structs
// ---------------------------------------------------------------------------
export type TranslatedWordEntry = {
	index: number
	words: string[]
	phraseTranslation?: string | null
}

export type TranslationSection = {
	section: SentenceDataEntry
	index: number
	isTranslated: boolean
}

export type TranslationSections = TranslationSection[]

export type ErrorWord = {
	word: WordObject
	sectionInd: number
	phrase?: string | string[] | null
	currentSection?: SentenceDataEntry
}

export type ErrorEntry = {
	userInput: string
	currentSentence: Sentence
	currentSection: SentenceDataEntry
	lessonNumber: number
	errorWords: ErrorWord[]
	references: string[]
}

export type SubmissionLog = {
	lessonNumber: number
	sentenceIndex: number
	sectionIndex: number | null
	feedbackMode: boolean
	hintRevealed?: boolean
	sentence: Sentence
	section: SentenceDataEntry
	isCorrect: boolean
	userInput: string
	id?: string
}
