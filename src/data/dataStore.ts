import { create } from "zustand"
import spanishData from "./spanishData"
import type { Lesson } from "./types"

interface DataStore {
	lessons: Lesson[]
	// sentences: Sentence[]
}

const lessons = spanishData.lessons

export const useDataStore = create<DataStore>((set, get) => ({
	lessons,
}))
