import { create } from "zustand"
import spanishData from "./spanishData"
import { normalizeText } from "@/lib/text"
import { expectedAnswers } from "@/lib/translation"
import { classifyVerbMistake, getVerbFeedback } from "@/lib/verbErrors"
import { classifyPronounMistake, getPronounFeedback } from "@/lib/pronounErrors"
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
	// When true, wrong answers trigger an immediate feedback modal instead of only end-of-lesson summary
	immediateFeedbackMode: boolean
	// Flip immediate feedback mode (persisting can be added later if desired)
	toggleImmediateFeedbackMode: () => void

	// mixup tracking: expectedNormalized -> { wrongNormalized: count }
	mixupMap: Record<string, Record<string, number>>

	// Return mixup stats, optionally filtered to a specific expected token
	getMixupStats: (
		expected?: string
	) => Array<{ expected: string; wrong: string; count: number }>
	clearMixups: () => void

	// sentences: Sentence[]
	startNewLesson: (index: number) => void
	markEmptyLessonComplete: (lessonNumber: number) => void
	initializeSentenceProgress: () => void
	setSectionTranslated: (sectionIndex: number, translated?: boolean) => void
	nextSentence: () => void
	getActiveSectionIndex: () => number | null
	checkCurrentAnswer: (input: string) => { correct: boolean; advanced: boolean }
	clearLogs: () => void
	// Allow marking a previous submission as correct
	markSubmissionCorrect: (submissionId: string) => void
	isLessonComplete: () => boolean
	getLessonSummary: () => LessonSummary
	// Mark the most recent (incorrect) submission as having revealed a hint
	markLastSubmissionHintRevealed: () => void
}

const lessons = spanishData.lessons

// Read persisted mixups (browser localStorage). Return {} when not present / unavailable.
function readMixupsFromStorage(): Record<string, Record<string, number>> {
	try {
		if (typeof window === "undefined" || !window.localStorage) return {}
		const raw = window.localStorage.getItem("mixupMap:v1")
		if (!raw) return {}
		return JSON.parse(raw)
	} catch {
		return {}
	}
}
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
	// Detailed verb breakdown for the attempt
	verbMistakeBreakdown?: {
		totals: {
			conjugation: number
			tense: number
			serVsEstar: number
			wrongRoot: number
		}
		tenseTransitions: Record<string, number>
		personTransitions: Record<string, number>
		serEstarTransitions: Record<string, number>
		rootTransitions: Record<string, number>
	}
}

export const useDataStore = create<DataStore>((set, get) => ({
	lessons,
	currentLessonIndex,
	currentSentenceIndex,
	currentSentenceProgress,
	submissionLog: [],
	errorLog: [],
	mixupMap: readMixupsFromStorage(),
	immediateFeedbackMode: false,
	toggleImmediateFeedbackMode: () =>
		set((s) => ({ immediateFeedbackMode: !s.immediateFeedbackMode })),
	markLastSubmissionHintRevealed: () => {
		set((state) => {
			if (state.submissionLog.length === 0) return {}
			const last = state.submissionLog[state.submissionLog.length - 1]
			if (last.isCorrect) return {}
			const updated = { ...last, hintRevealed: true }
			const newLog = [...state.submissionLog]
			newLog[newLog.length - 1] = updated
			return { submissionLog: newLog }
		})
	},

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
			immediateFeedbackMode,
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
			// generate a short unique id for UI actions
			id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
			lessonNumber: lesson.lesson,
			sentenceIndex: currentSentenceIndex,
			sectionIndex: next.index,
			feedbackMode: immediateFeedbackMode,
			sentence,
			section: entry,
			isCorrect,
			userInput: input,
		}
		set({ submissionLog: [...submissionLog, submission] })

		if (!isCorrect) {
			// Update mixup counts: for each expected answer, increment wrong->count
			try {
				const wrong = normalizeText(input)
				for (const exp of answers) {
					set((state) => {
						const m = { ...state.mixupMap }
						if (!m[exp]) m[exp] = {}
						m[exp][wrong] = (m[exp][wrong] || 0) + 1
						return { mixupMap: m }
					})
					// persist after update
					try {
						if (typeof window !== "undefined" && window.localStorage) {
							window.localStorage.setItem(
								"mixupMap:v1",
								JSON.stringify(get().mixupMap)
							)
						}
					} catch {}
				}
			} catch {
				// noop
			}

			// Add error with references if present
			const references = (
				entry as { reference?: Record<string, (number | string)[]> }
			).reference
			const refKeys = references ? Object.keys(references) : []
			// Verb mistake classification: append virtual categories for analytics
			try {
				const tags = classifyVerbMistake(entry, input)
				for (const t of tags) refKeys.push(t)
			} catch {}
			// Pronoun + possessive mistake classification
			try {
				const ptags = classifyPronounMistake(entry, input)
				for (const t of ptags) refKeys.push(t)
			} catch {}
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
	// Mark a previously incorrect submission as correct (e.g., typo forgiveness)
	markSubmissionCorrect: (submissionId: string) => {
		const { submissionLog, errorLog, currentSentenceProgress } = get()
		// Find submission
		const idx = submissionLog.findIndex((s) => s.id === submissionId)
		if (idx === -1) return
		const sub = submissionLog[idx]
		// Update submission log entry to isCorrect = true
		const updatedSub = { ...sub, isCorrect: true }
		const newSubs = [...submissionLog]
		newSubs[idx] = updatedSub
		// Decrement mixup counts for this forgiven wrong input
		try {
			const wrong = normalizeText(sub.userInput)
			// expected answers for the section
			const expected = expectedAnswers(sub.section)
			set((state) => {
				const m = { ...state.mixupMap }
				for (const exp of expected) {
					if (!m[exp]) continue
					m[exp][wrong] = (m[exp][wrong] || 0) - 1
					if (m[exp][wrong] <= 0) delete m[exp][wrong]
					// remove empty maps
					if (Object.keys(m[exp]).length === 0) delete m[exp]
				}
				return { mixupMap: m }
			})
			// persist after update
			try {
				if (typeof window !== "undefined" && window.localStorage) {
					window.localStorage.setItem(
						"mixupMap:v1",
						JSON.stringify(get().mixupMap)
					)
				}
			} catch {}
		} catch {
			// noop
		}
		// Remove related error entries (match by lesson/sentence/section/userInput)
		const newErrors = errorLog.filter(
			(e) =>
				!(
					e.lessonNumber === sub.lessonNumber &&
					e.currentSentence.id === sub.sentence.id &&
					e.currentSection === sub.section &&
					e.userInput === sub.userInput
				)
		)
		set({ submissionLog: newSubs, errorLog: newErrors })

		// Optionally mark the section translated in the current progress if it matches
		if (currentSentenceProgress) {
			const updatedSections = currentSentenceProgress.translationSections.map(
				(s) => (s.index === sub.sectionIndex ? { ...s, isTranslated: true } : s)
			)
			set({ currentSentenceProgress: { translationSections: updatedSections } })
		}
	},

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
		// Aggregated references for the summary (exclude virtual verb/pronoun error tags)
		const refs = Array.from(new Set(errs.flatMap((e) => e.references))).filter(
			(r) => !r.startsWith("verb.error.") && !r.startsWith("pron.error.")
		)

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

		// Build detailed verb mistake breakdown from incorrect submissions
		const verbTotals = {
			conjugation: 0,
			tense: 0,
			serVsEstar: 0,
			wrongRoot: 0,
		}
		const tenseTransitions: Record<string, number> = {}
		const personTransitions: Record<string, number> = {}
		const serEstarTransitions: Record<string, number> = {}
		const rootTransitions: Record<string, number> = {}

		// Collect example pairs per transition: wrong surface -> expected surface with counts
		const tenseExamplePairs: Record<string, Record<string, number>> = {}
		const personExamplePairs: Record<string, Record<string, number>> = {}
		const serEstarExamplePairs: Record<string, Record<string, number>> = {}
		const rootExamplePairs: Record<string, Record<string, number>> = {}

		for (const s of incorrect) {
			try {
				const items = getVerbFeedback(s.section, s.userInput)
				for (const it of items) {
					if (it.tag === "verb.error.tense") {
						verbTotals.tense += 1
						const fromT = (it.wrong?.tense || "unknown").toString()
						const toT = (it.expected?.tense || "unknown").toString()
						const key = `${fromT}->${toT}`
						tenseTransitions[key] = (tenseTransitions[key] || 0) + 1
						// example pair
						if (it.wrong?.surface && it.expected?.surface) {
							const pKey = `${it.wrong.surface}||${it.expected.surface}`
							if (!tenseExamplePairs[key]) tenseExamplePairs[key] = {}
							tenseExamplePairs[key][pKey] =
								(tenseExamplePairs[key][pKey] || 0) + 1
						}
					} else if (it.tag === "verb.error.conjugation") {
						verbTotals.conjugation += 1
						const fromP = (it.wrong?.person || "unknown").toString()
						const toP = (it.expected?.person || "unknown").toString()
						const key = `${fromP}->${toP}`
						personTransitions[key] = (personTransitions[key] || 0) + 1
						if (it.wrong?.surface && it.expected?.surface) {
							const pKey = `${it.wrong.surface}||${it.expected.surface}`
							if (!personExamplePairs[key]) personExamplePairs[key] = {}
							personExamplePairs[key][pKey] =
								(personExamplePairs[key][pKey] || 0) + 1
						}
					} else if (it.tag === "verb.error.ser-vs-estar") {
						verbTotals.serVsEstar += 1
						const key = `${it.wrong?.root || "?"}->${it.expected?.root || "?"}`
						serEstarTransitions[key] = (serEstarTransitions[key] || 0) + 1
						if (it.wrong?.surface && it.expected?.surface) {
							const pKey = `${it.wrong.surface}||${it.expected.surface}`
							if (!serEstarExamplePairs[key]) serEstarExamplePairs[key] = {}
							serEstarExamplePairs[key][pKey] =
								(serEstarExamplePairs[key][pKey] || 0) + 1
						}
					} else if (it.tag === "verb.error.wrong-root") {
						verbTotals.wrongRoot += 1
						const key = `${it.wrong?.root || "?"}->${it.expected?.root || "?"}`
						rootTransitions[key] = (rootTransitions[key] || 0) + 1
						if (it.wrong?.surface && it.expected?.surface) {
							const pKey = `${it.wrong.surface}||${it.expected.surface}`
							if (!rootExamplePairs[key]) rootExamplePairs[key] = {}
							rootExamplePairs[key][pKey] =
								(rootExamplePairs[key][pKey] || 0) + 1
						}
					}
				}
			} catch {
				// ignore feedback parse errors
			}
		}

		// Build detailed pronoun mistake breakdown from incorrect submissions
		const pronTotals = {
			category: 0,
			person: 0,
		}
		const pronCategoryTransitions: Record<string, number> = {}
		const pronPersonTransitions: Record<string, number> = {}
		const pronCatExamplePairs: Record<string, Record<string, number>> = {}
		const pronPersonExamplePairs: Record<string, Record<string, number>> = {}

		for (const s of incorrect) {
			try {
				const items = getPronounFeedback(s.section, s.userInput)
				for (const it of items) {
					if (it.tag === "pron.error.category") {
						pronTotals.category += 1
						const fromC = (it.wrong?.category || "?").toString()
						const toC = (it.expected?.category || "?").toString()
						const key = `${fromC}->${toC}`
						pronCategoryTransitions[key] =
							(pronCategoryTransitions[key] || 0) + 1
						if (it.wrong?.surface && it.expected?.surface) {
							const pKey = `${it.wrong.surface}||${it.expected.surface}`
							if (!pronCatExamplePairs[key]) pronCatExamplePairs[key] = {}
							pronCatExamplePairs[key][pKey] =
								(pronCatExamplePairs[key][pKey] || 0) + 1
						}
					} else if (it.tag === "pron.error.person") {
						pronTotals.person += 1
						const fromP = (it.wrong?.person || "unknown").toString()
						const toP = (it.expected?.person || "unknown").toString()
						const key = `${fromP}->${toP}`
						pronPersonTransitions[key] = (pronPersonTransitions[key] || 0) + 1
						if (it.wrong?.surface && it.expected?.surface) {
							const pKey = `${it.wrong.surface}||${it.expected.surface}`
							if (!pronPersonExamplePairs[key]) pronPersonExamplePairs[key] = {}
							pronPersonExamplePairs[key][pKey] =
								(pronPersonExamplePairs[key][pKey] || 0) + 1
						}
					}
				}
			} catch {
				// ignore feedback parse errors
			}
		}

		// Aggregate error categories across entire lesson attempt.
		// Use error log entries (errs) so we include virtual tags like verb.error.*
		const errorCategoryCounts: Record<string, number> = {}
		for (const e of errs) {
			for (const r of e.references || []) {
				// Count ALL references here, including virtual tags like verb.error.*
				// These power the "Verb mistakes" section and other analytics.
				errorCategoryCounts[r] = (errorCategoryCounts[r] || 0) + 1
			}
		}

		// Build a map of reference key -> sentenceIndex counts from error log entries
		const referenceSourcesMap: Record<string, Record<number, number>> = {}
		for (const e of errs) {
			// try to resolve sentence index within this lesson
			let sentIdx = -1
			if (lesson.sentences && e.currentSentence) {
				// Prefer matching by id
				sentIdx = lesson.sentences.findIndex(
					(s) => s.id === e.currentSentence.id
				)
				// Fallback to matching by sentence text if id didn't match
				if (sentIdx < 0 && typeof e.currentSentence.sentence === "string") {
					sentIdx = lesson.sentences.findIndex(
						(s) => s.sentence === e.currentSentence.sentence
					)
				}
			}
			// If we couldn't reliably map this error to a sentence index, skip it
			if (sentIdx < 0) continue
			for (const rKey of e.references || []) {
				// Skip virtual analytics tags from tooltip generation
				if (rKey.startsWith("verb.error.") || rKey.startsWith("pron.error."))
					continue
				if (!referenceSourcesMap[rKey]) referenceSourcesMap[rKey] = {}
				referenceSourcesMap[rKey][sentIdx] =
					(referenceSourcesMap[rKey][sentIdx] || 0) + 1
			}
		}

		// Convert to human-readable string map (e.g., "Generated from sentence(s): #3 (2), #7 (1)")
		const referenceSources: Record<string, string> = {}
		for (const [rKey, bySent] of Object.entries(referenceSourcesMap)) {
			const parts: string[] = []
			for (const [siStr, cnt] of Object.entries(bySent)) {
				const si = Number(siStr)
				parts.push(`#${si + 1} (${cnt})`)
			}
			if (parts.length)
				referenceSources[rKey] = `Generated from sentence(s): ${parts.join(
					", "
				)}`
		}

		// Convert example pairs maps to array form, sorted by count desc
		function toExampleArray(m: Record<string, number>) {
			return Object.entries(m)
				.map(([k, c]) => {
					const [wrong, expected] = k.split("||")
					return { wrong, expected, count: c }
				})
				.sort((a, b) => b.count - a.count)
		}

		const verbMistakeExamples = {
			tense: Object.fromEntries(
				Object.entries(tenseExamplePairs).map(([k, v]) => [
					k,
					toExampleArray(v),
				])
			),
			person: Object.fromEntries(
				Object.entries(personExamplePairs).map(([k, v]) => [
					k,
					toExampleArray(v),
				])
			),
			serEstar: Object.fromEntries(
				Object.entries(serEstarExamplePairs).map(([k, v]) => [
					k,
					toExampleArray(v),
				])
			),
			root: Object.fromEntries(
				Object.entries(rootExamplePairs).map(([k, v]) => [k, toExampleArray(v)])
			),
		}

		const pronounMistakeExamples = {
			category: Object.fromEntries(
				Object.entries(pronCatExamplePairs).map(([k, v]) => [
					k,
					toExampleArray(v),
				])
			),
			person: Object.fromEntries(
				Object.entries(pronPersonExamplePairs).map(([k, v]) => [
					k,
					toExampleArray(v),
				])
			),
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
			referenceSources,
			verbMistakeBreakdown: {
				totals: verbTotals,
				tenseTransitions,
				personTransitions,
				serEstarTransitions,
				rootTransitions,
			},
			verbMistakeExamples,
			pronounMistakeBreakdown: {
				totals: pronTotals,
				categoryTransitions: pronCategoryTransitions,
				personTransitions: pronPersonTransitions,
			},
			pronounMistakeExamples,
		}
	},

	// Return aggregated mixup stats as array sorted by count desc
	getMixupStats: (expected?: string) => {
		const { mixupMap } = get()
		const rows: Array<{ expected: string; wrong: string; count: number }> = []
		for (const exp of Object.keys(mixupMap)) {
			if (expected && expected !== exp) continue
			for (const wrong of Object.keys(mixupMap[exp])) {
				rows.push({ expected: exp, wrong, count: mixupMap[exp][wrong] })
			}
		}
		rows.sort((a, b) => b.count - a.count)
		return rows
	},

	clearMixups: () => set({ mixupMap: {} }),
}))
