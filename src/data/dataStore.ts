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
	emptyLessonCompleted: Record<number, boolean>

	// sentences: Sentence[]
	startNewLesson: (index: number) => void
	markEmptyLessonComplete: (lessonNumber: number) => void
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
// Start app on Lesson 3 by default (index 2)
const currentLessonIndex = 2
const currentSentenceIndex = 0
const currentSentenceProgress = null
const emptyLessonCompleted: Record<number, boolean> = {}

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
	// Added analytics for richer feedback
	sentenceStats: Array<{
		sentenceIndex: number
		totalSections: number
		attemptsBySection: Record<string, number>
		incorrectAttemptsBySection: Record<string, number>
		firstTryCorrectSections: number[]
		incorrectSections: number[]
		errorReferences: Record<string, number>
	}>
	errorCategoryCounts: Record<string, number>
}

export const useDataStore = create<DataStore>((set, get) => ({
	lessons,
	currentLessonIndex,
	currentSentenceIndex,
	currentSentenceProgress,
	submissionLog: [],
	errorLog: [],
	emptyLessonCompleted,
	startNewLesson: (index: number) => {
		set({
			currentLessonIndex: index,
			currentSentenceIndex: 0,
			currentSentenceProgress: null,
			submissionLog: [],
			errorLog: [],
		})
	},
	markEmptyLessonComplete: (lessonNumber: number) => {
		set((state) => ({
			emptyLessonCompleted: {
				...state.emptyLessonCompleted,
				[lessonNumber]: true,
			},
		}))
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
			emptyLessonCompleted,
		} = get()
		const sentences = lessons[currentLessonIndex]?.sentences ?? []
		// Empty lessons only count as complete if explicitly marked
		if (sentences.length === 0) {
			const lessonNumber = lessons[currentLessonIndex].lesson
			return Boolean(emptyLessonCompleted[lessonNumber])
		}
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

		// --- Added detailed analytics ---
		// Group submissions by sentence & section to derive stats
		const sentenceStatsMap = new Map<
			number,
			{
				sentenceIndex: number
				totalSections: number
				attemptsBySection: Record<string, number>
				incorrectAttemptsBySection: Record<string, number>
				firstAttemptBySection: Record<string, SubmissionLog | undefined>
				incorrectSectionsSet: Set<number>
				errorReferences: Record<string, number>
			}
		>()

		for (const s of subs) {
			const sentIdx: number = s.sentenceIndex
			if (!sentenceStatsMap.has(sentIdx)) {
				const totalSections = (s.sentence?.data || []).filter(
					(entry: SentenceDataEntry) =>
						Boolean((entry as SentenceDataEntry)?.translation)
				).length
				sentenceStatsMap.set(sentIdx, {
					sentenceIndex: sentIdx,
					totalSections,
					attemptsBySection: {},
					incorrectAttemptsBySection: {},
					firstAttemptBySection: {},
					incorrectSectionsSet: new Set<number>(),
					errorReferences: {},
				})
			}
			const stat = sentenceStatsMap.get(sentIdx)!
			const key = String(s.sectionIndex)
			stat.attemptsBySection[key] = (stat.attemptsBySection[key] || 0) + 1
			if (!stat.firstAttemptBySection[key]) stat.firstAttemptBySection[key] = s
			if (!s.isCorrect) {
				stat.incorrectAttemptsBySection[key] =
					(stat.incorrectAttemptsBySection[key] || 0) + 1
				// sectionIndex is number in SubmissionLog
				if (typeof s.sectionIndex === "number") {
					stat.incorrectSectionsSet.add(s.sectionIndex)
				}
				const refsObj: Record<string, (number | string)[]> =
					(
						s.section as unknown as {
							reference?: Record<string, (number | string)[]>
						}
					).reference || {}
				for (const rKey of Object.keys(refsObj)) {
					stat.errorReferences[rKey] = (stat.errorReferences[rKey] || 0) + 1
				}
			}
		}

		const sentenceStats = Array.from(sentenceStatsMap.values()).map((v) => {
			const firstTryCorrectSections: number[] = []
			for (const [secKey, firstAttempt] of Object.entries(
				v.firstAttemptBySection
			)) {
				if (firstAttempt && firstAttempt.isCorrect) {
					// If only one attempt overall for this section and it's correct => first try success
					if (v.attemptsBySection[secKey] === 1) {
						firstTryCorrectSections.push(Number(secKey))
					}
				}
			}
			return {
				sentenceIndex: v.sentenceIndex,
				totalSections: v.totalSections,
				attemptsBySection: v.attemptsBySection,
				incorrectAttemptsBySection: v.incorrectAttemptsBySection,
				firstTryCorrectSections,
				incorrectSections: Array.from(v.incorrectSectionsSet.values()),
				errorReferences: v.errorReferences,
			}
		})

		// Aggregate error categories across entire lesson attempt
		const errorCategoryCounts: Record<string, number> = {}
		for (const inc of incorrect) {
			for (const r of inc.references || []) {
				errorCategoryCounts[r] = (errorCategoryCounts[r] || 0) + 1
			}
		}
		return {
			lessonNumber: lessonNum,
			correctCount: correct.length,
			incorrectCount: incorrect.length,
			totalSubmissions: subs.length,
			correct,
			incorrect,
			references: refs,
			sentenceStats,
			errorCategoryCounts,
		}
	},
}))
