import type { Sentence, PronounGroup, WordGroup, VerbGroup } from "@/data/types"

// Topic identifiers use namespaces for stability
// Examples:
//   pos:Article
//   group:pron.demonstrative
//   word:artcl.el
//   verbRoot:verb.ser (if implemented later)
export type TopicId = string

export interface TopicNode {
	id: TopicId
	label: string
	children?: TopicNode[]
	// Optional description / info array (could surface on hover)
	info?: string[]
	// Count of candidate sentences (filled server-side)
	candidateCount?: number
	// Full hierarchical path label for display chips
	pathLabel?: string
}

export interface QuizConfig {
	questionCount: number // 10-50
	topics: TopicId[]
	seed?: string
	boostTopics?: TopicId[] // optional weighting hint
}

export interface QuizQuestion {
	sentenceId: number
	sentence: Sentence
	matchedTopics: TopicId[]
}

export interface GeneratedQuiz {
	config: QuizConfig
	questions: QuizQuestion[]
	createdAt: string
	indexVersion: string // hash / version string of the data snapshot
	meta?: {
		perTopicCounts: Record<string, number>
		candidatePoolSize: number
		shortfall: boolean
	}
}

export interface SentenceTopicIndex {
	topicToSentences: Map<TopicId, number[]>
	sentenceTopics: Map<number, Set<TopicId>>
	sentences: Sentence[] // flat list preserving id uniqueness
	version: string
}

export interface TopicBuildContext {
	artcl: WordGroup
	conj: WordGroup
	pron: PronounGroup
	prep: WordGroup
	advrb: WordGroup
	noun: WordGroup
	verb: VerbGroup
}
