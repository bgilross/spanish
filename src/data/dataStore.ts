import { create } from "zustand"
import spanishData from "./spanishData"
import { normalizeText } from "@/lib/text"
import { expectedAnswers } from "@/lib/translation"
import type {
	Lesson,
	SentenceDataEntry,
	TranslationSections,
	// TranslationSection,
	// CurrentTranslationSections,
} from "./types"

interface DataStore {
	lessons: Lesson[]
	currentLessonIndex: number
	currentSentenceIndex: number
	currentSentenceProgress: SentenceProgress | null

	// sentences: Sentence[]
	startNewLesson: (index: number) => void
	initializeSentenceProgress: () => void
	setSectionTranslated: (sectionIndex: number, translated?: boolean) => void
	nextSentence: () => void
	getActiveSectionIndex: () => number | null
	checkCurrentAnswer: (input: string) => { correct: boolean; advanced: boolean }
}

const lessons = spanishData.lessons
const currentLessonIndex = 0
const currentSentenceIndex = 0
const currentSentenceProgress = null

type SentenceProgress = {
	translationSections: TranslationSections
}

export const useDataStore = create<DataStore>((set, get) => ({
	lessons,
	currentLessonIndex,
	currentSentenceIndex,
	currentSentenceProgress,
	startNewLesson: (index: number) => {
		set({ currentLessonIndex: index, currentSentenceIndex: 0 })
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
		if (!answers.includes(normalized))
			return { correct: false, advanced: false }

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
}))
