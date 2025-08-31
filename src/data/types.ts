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
	noPronoun?: boolean
}

// Enhanced Word Object interface
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
}

// For referencing words in translation objects
export type WordReference = {
	id: string
	referenceIndices?: number[]
}

// Improved sentence data entry
export type SentenceDataEntry =
	| {
			phrase: string
			translation?: WordObject | string
			mixup?: WordObject | WordObject[] // For when a word might be confused with anotherw
	  }
	| {
			phrase: string
			phraseTranslation?: string | string[]
			translation: WordObject | WordObject[] | string
			reference?: Record<string, (number | string)[]>
			mixup?: WordObject
	  }

// Helper types for your word structures
export type WordGroup = {
	id: string
	name: string
	info: string[]
	words: Record<string, WordObject>
}

export interface VerbConjugation extends WordObject {
	tense: string
	person: string
}

export interface VerbRoot extends WordObject {
	info: string[]
	present: Record<string, VerbConjugation>
	// past: Record<string, VerbConjugation>
}

export interface VerbGroup {
	id: string
	name: string
	info: string[]
	words: Record<string, VerbRoot>
}

export type QuizType = "parts" | "full"

export type TranslatedWordEntry = {
	index: number
	words: string[]
	phraseTranslation?: string | null
}

export type CurrentSectionEntry = { section: SentenceDataEntry; index: number }

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
	mode: QuizType
}

export type SubmissionLog = {
	lessonNumber: number
	sentenceIndex: number
	sectionIndex: number | null
	quizType: QuizType
	feedbackMode: boolean
	sentence: Sentence
	section: SentenceDataEntry
	isCorrect: boolean
	userInput: string
}
