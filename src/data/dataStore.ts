import { create } from "zustand"
import spanishData from "./spanishData"
import { normalizeText } from "@/lib/text"
import { expectedAnswers } from "@/lib/translation"
import type {
	Lesson,
	SentenceDataEntry,
	TranslationSections,
	SubmissionLog,
	ErrorEntry,
} from "./types"

interface DataStore {
	lessons: Lesson[]
	currentLessonIndex: number
	currentSentenceIndex: number
	currentSentenceProgress: SentenceProgress | null
	submissionLog: SubmissionLog[]
	errorLog: ErrorEntry[]

	// sentences: Sentence[]
	startNewLesson: (index: number) => void
	initializeSentenceProgress: () => void
	setSectionTranslated: (sectionIndex: number, translated?: boolean) => void
	nextSentence: () => void
	getActiveSectionIndex: () => number | null
	checkCurrentAnswer: (input: string) => { correct: boolean; advanced: boolean }
	clearLogs: () => void
	isLessonComplete: () => boolean
	getLessonSummary: () => LessonSummary
}

const lessons = spanishData.lessons
const currentLessonIndex = 0
const currentSentenceIndex = 0
const currentSentenceProgress = null

type SentenceProgress = {
	translationSections: TranslationSections
}

type LessonSummary = {
	lessonNumber: number
	correctCount: number
	incorrectCount: number
	totalSubmissions: number
	correct: SubmissionLog[]
	incorrect: Array<
		SubmissionLog & { expected?: string[]; references?: string[] }
	>
	references: string[]
}

export const useDataStore = create<DataStore>((set, get) => ({
	lessons,
	currentLessonIndex,
	currentSentenceIndex,
	currentSentenceProgress,
	submissionLog: [],
	errorLog: [],
	startNewLesson: (index: number) => {
		set({
			currentLessonIndex: index,
			currentSentenceIndex: 0,
			currentSentenceProgress: null,
			submissionLog: [],
			errorLog: [],
		})
	},

	initializeSentenceProgress: () => {
		const { lessons, currentLessonIndex, currentSentenceIndex } = get()
		const currentLesson = lessons[currentLessonIndex]
		if (!currentLesson.sentences) return
		if (currentLesson.sentences.length === 0) return
		const currentSentenceData =
			currentLesson.sentences[currentSentenceIndex].data

		// Build only real sections (no undefined) and keep original index
		const translationSections: TranslationSections = currentSentenceData.reduce(
			(acc: TranslationSections, entry: SentenceDataEntry, index: number) => {
				if (entry.translation) {
					acc.push({ section: entry, index, isTranslated: false })
				}
				return acc
			},
			[]
		)

		set({ currentSentenceProgress: { translationSections } })
	},

	setSectionTranslated: (sectionIndex: number, translated: boolean = true) => {
		const { currentSentenceProgress } = get()
		if (!currentSentenceProgress) return
		const updated: TranslationSections =
			currentSentenceProgress.translationSections.map((sec) =>
				sec.index === sectionIndex ? { ...sec, isTranslated: translated } : sec
			)
		set({ currentSentenceProgress: { translationSections: updated } })
	},

	nextSentence: () => {
		const { currentLessonIndex, currentSentenceIndex, lessons } = get()
		const sentences = lessons[currentLessonIndex]?.sentences ?? []
		const next = currentSentenceIndex + 1
		if (next < sentences.length) {
			set({ currentSentenceIndex: next, currentSentenceProgress: null })
		}
	},

	getActiveSectionIndex: () => {
		const { currentSentenceProgress } = get()
		const next = currentSentenceProgress?.translationSections.find(
			(s) => !s.isTranslated
		)
		return next ? next.index : null
	},

	checkCurrentAnswer: (input: string) => {
		const {
			lessons,
			currentLessonIndex,
			currentSentenceIndex,
			currentSentenceProgress,
			submissionLog,
			errorLog,
		} = get()
		const lesson = lessons[currentLessonIndex]
		const sentence = lesson.sentences?.[currentSentenceIndex]
		if (!sentence || !currentSentenceProgress)
			return { correct: false, advanced: false }

		const next = currentSentenceProgress.translationSections.find(
			(s) => !s.isTranslated
		)
		if (!next) return { correct: false, advanced: false }

		const entry = sentence.data[next.index]
		const answers = expectedAnswers(entry)
		if (answers.length === 0) return { correct: false, advanced: false }

		const normalized = normalizeText(input)
		const isCorrect = answers.includes(normalized)

		// Log submission
		const submission: SubmissionLog = {
			lessonNumber: lesson.lesson,
			sentenceIndex: currentSentenceIndex,
			sectionIndex: next.index,
			feedbackMode: false,
			sentence,
			section: entry,
			isCorrect,
			userInput: input,
		}
		set({ submissionLog: [...submissionLog, submission] })

		if (!isCorrect) {
			// Add error with references if present
			const references = (
				entry as { reference?: Record<string, (number | string)[]> }
			).reference
			const refKeys = references ? Object.keys(references) : []
			const error: ErrorEntry = {
				userInput: input,
				currentSentence: sentence,
				currentSection: entry,
				lessonNumber: lesson.lesson,
				errorWords: [],
				references: refKeys,
			}
			set({ errorLog: [...errorLog, error] })
			return { correct: false, advanced: false }
		}

		// Mark translated
		set((state) => {
			if (!state.currentSentenceProgress) return {}
			const updated = state.currentSentenceProgress.translationSections.map(
				(s) => (s.index === next.index ? { ...s, isTranslated: true } : s)
			)
			return { currentSentenceProgress: { translationSections: updated } }
		})

		// Check if all done
		const remaining = get().currentSentenceProgress!.translationSections.some(
			(s) => !s.isTranslated
		)
		if (!remaining) {
			// advance to next sentence; progress will be re-initialized by the UI effect
			get().nextSentence()
			return { correct: true, advanced: true }
		}

		return { correct: true, advanced: false }
	},
	clearLogs: () => set({ submissionLog: [], errorLog: [] }),

	isLessonComplete: () => {
		const {
			lessons,
			currentLessonIndex,
			currentSentenceIndex,
			currentSentenceProgress,
		} = get()
		const sentences = lessons[currentLessonIndex]?.sentences ?? []
		const isLast = currentSentenceIndex >= sentences.length - 1
		const allDone =
			currentSentenceProgress?.translationSections.every(
				(s) => s.isTranslated
			) ?? false
		return isLast && allDone
	},

	getLessonSummary: () => {
		const { lessons, currentLessonIndex, submissionLog, errorLog } = get()
		const lesson = lessons[currentLessonIndex]
		const lessonNum = lesson.lesson
		const subs = submissionLog.filter((s) => s.lessonNumber === lessonNum)
		const errs = errorLog.filter((e) => e.lessonNumber === lessonNum)
		const correct = subs.filter((s) => s.isCorrect)
		const incorrect = subs
			.filter((s) => !s.isCorrect)
			.map((s) => {
				const refs = (
					s.section as {
						reference?: Record<string, (number | string)[]>
					}
				).reference
				const refKeys = refs ? Object.keys(refs) : []
				return {
					...s,
					expected: expectedAnswers(s.section),
					references: refKeys,
				}
			})
		const refs = Array.from(new Set(errs.flatMap((e) => e.references)))
		return {
			lessonNumber: lessonNum,
			correctCount: correct.length,
			incorrectCount: incorrect.length,
			totalSubmissions: subs.length,
			correct,
			incorrect,
			references: refs,
		}
	},
}))
