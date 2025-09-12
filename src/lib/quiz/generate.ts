import { getSentenceTopicIndex } from "./index"
import type { QuizConfig, GeneratedQuiz, QuizQuestion, TopicId } from "./types"

// Lightweight seeded RNG (Mulberry32)
function mulberry32(seed: number) {
	return function () {
		let t = (seed += 0x6d2b79f5)
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

function seededShuffle<T>(arr: T[], rnd: () => number): T[] {
	const a = [...arr]
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(rnd() * (i + 1))
		;[a[i], a[j]] = [a[j], a[i]]
	}
	return a
}

export function generateQuiz(config: QuizConfig): GeneratedQuiz {
	const { questionCount, topics } = config
	if (questionCount < 1) throw new Error("questionCount must be > 0")
	if (!topics.length) throw new Error("At least one topic required")

	const index = getSentenceTopicIndex()
	const seedNum = hashSeed(config.seed || Date.now().toString())
	const rnd = mulberry32(seedNum)

	// Build candidate sets per topic
	const perTopic: Record<string, number[]> = {}
	topics.forEach((t) => {
		const list = index.topicToSentences.get(t) || []
		perTopic[t] = seededShuffle(list, rnd)
	})

	// Desired per-topic coverage baseline
	const baseNeed = Math.max(1, Math.ceil(questionCount / topics.length))
	const remaining: Record<string, number> = {}
	topics.forEach((t) => (remaining[t] = baseNeed))

	const chosen = new Map<number, QuizQuestion>()

	// Round-robin attempt to satisfy per-topic needs
	let safety = 0
	while (chosen.size < questionCount && safety < 10000) {
		safety++
		let progress = false
		for (const t of topics) {
			if (chosen.size >= questionCount) break
			if (remaining[t] <= 0) continue
			const pool = perTopic[t]
			const candidate = pool.find((id) => !chosen.has(id))
			if (candidate == null) continue
			const matched = index.sentenceTopics.get(candidate) || new Set<TopicId>()
			const sentence = index.sentences.find((s) => s.id === candidate)!
			chosen.set(candidate, {
				sentenceId: candidate,
				sentence,
				matchedTopics: topics.filter((tp) => matched.has(tp)),
			})
			// Decrement for each topic satisfied by this sentence
			for (const mt of topics) {
				if (matched.has(mt) && remaining[mt] > 0) remaining[mt]--
			}
			progress = true
		}
		if (!progress) break
	}

	// If still below target, fill from union pool
	if (chosen.size < questionCount) {
		const union = Array.from(
			new Set(topics.flatMap((t) => perTopic[t]))
		).filter((id) => !chosen.has(id))
		const shuffledUnion = seededShuffle(union, rnd)
		for (const id of shuffledUnion) {
			if (chosen.size >= questionCount) break
			const matched = index.sentenceTopics.get(id) || new Set<TopicId>()
			const sentence = index.sentences.find((s) => s.id === id)!
			chosen.set(id, {
				sentenceId: id,
				sentence,
				matchedTopics: topics.filter((tp) => matched.has(tp)),
			})
		}
	}

	const questions = Array.from(chosen.values()).slice(0, questionCount)

	// Metadata: per-topic counts and candidate union size
	const perTopicCounts: Record<string, number> = {}
	topics.forEach((t) => {
		perTopicCounts[t] = perTopic[t]?.length || 0
	})
	const candidateUnionSize = new Set(topics.flatMap((t) => perTopic[t] || []))
		.size
	const shortfall = candidateUnionSize < questionCount

	return {
		config,
		questions,
		createdAt: new Date().toISOString(),
		indexVersion: index.version,
		meta: {
			perTopicCounts,
			candidatePoolSize: candidateUnionSize,
			shortfall,
		},
	}
}

function hashSeed(seed: string): number {
	let h = 2166136261 >>> 0
	for (let i = 0; i < seed.length; i++) {
		h ^= seed.charCodeAt(i)
		h = Math.imul(h, 16777619)
	}
	return h >>> 0
}
