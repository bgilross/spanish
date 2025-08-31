import { create } from "zustand"
import spanishData from "./spanishData"
import type { Lesson } from "./types"

interface DataStore {
	lessons: Lesson[]
	currentLessonIndex: number
	currentSentenceIndex: number

	// sentences: Sentence[]
	startNewLesson: (index: number) => void
}

const lessons = spanishData.lessons
const currentLessonIndex = 0
const currentSentenceIndex = 0

export const useDataStore = create<DataStore>((set, get) => ({
	lessons,
	currentLessonIndex,
	currentSentenceIndex,
	startNewLesson: (index: number) => {
		set({ currentLessonIndex: index, currentSentenceIndex: 0 })
	},
}))
