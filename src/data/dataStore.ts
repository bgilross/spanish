import { create } from "zustand"
import spanishData from "./spanishData"
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
}))
