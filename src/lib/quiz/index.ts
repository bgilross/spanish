import spanishWords from "@/data/spanishWords"
import * as spanishDataModule from "@/data/spanishData"
import type {
	Sentence,
	SentenceDataEntry,
	WordObject,
	PronounGroup,
	WordGroup,
	VerbRoot,
} from "@/data/types"
import type {
	SentenceTopicIndex,
	TopicNode,
	TopicBuildContext,
	TopicId,
} from "./types"
import crypto from "crypto"

// Singleton memoized index
let _index: SentenceTopicIndex | null = null
let _topics: TopicNode[] | null = null

export function getTopicTree(): TopicNode[] {
	if (_topics) return _topics
	const raw = buildTopicTree(spanishWords as unknown as TopicBuildContext)
	// After building raw tree, annotate with candidate counts
	const index = getSentenceTopicIndex()
	const annotate = (nodes: TopicNode[], parentPath: string[] = []) => {
		for (const n of nodes) {
			const list = index.topicToSentences.get(n.id) || []
			n.candidateCount = list.length
			const path = [...parentPath, n.label]
			n.pathLabel = path.join(" / ")
			if (n.children && n.children.length) annotate(n.children, path)
		}
	}
	annotate(raw)
	_topics = raw
	return _topics
}

export function getSentenceTopicIndex(): SentenceTopicIndex {
	if (_index) return _index
	const sentences: Sentence[] = []
	interface SDLike {
		lessons: Sentence[] | { sentences?: Sentence[] }[]
	}
	// Attempt to extract default export while remaining resilient to module shape
	const spanishData =
		(spanishDataModule as unknown as { default?: SDLike }).default ||
		(spanishDataModule as unknown as SDLike)
	for (const raw of spanishData.lessons as unknown[]) {
		const lesson = raw as { sentences?: unknown }
		if (!Array.isArray(lesson.sentences)) continue
		for (const s of lesson.sentences as unknown[]) {
			// Narrow minimal shape
			const sent = s as Sentence
			if (typeof sent.id !== "number" || !Array.isArray(sent.data)) continue
			sentences.push(sent)
		}
	}
	const topicToSentences = new Map<TopicId, Set<number>>()
	const sentenceTopics = new Map<number, Set<TopicId>>()

	const push = (topic: TopicId, sentenceId: number) => {
		if (!topicToSentences.has(topic)) topicToSentences.set(topic, new Set())
		topicToSentences.get(topic)!.add(sentenceId)
	}

	for (const s of sentences) {
		const tset = new Set<TopicId>()
		// Derive topics from each phrase's translation field(s)
		for (const part of s.data) {
			const maybe = (
				part as SentenceDataEntry & {
					translation?: WordObject | WordObject[] | string
				}
			).translation
			const addWord = (w: WordObject | string | undefined | null) => {
				if (!w) return
				if (typeof w === "string") return // plain string translation not tracked as word topic
				// Word-level topic
				tset.add(`word:${w.id}`)
				if (w.pos) tset.add(`pos:${w.pos}`)
				const segs = String(w.id).split(".")
				if (segs.length > 1) {
					tset.add(`group:${segs[0]}`)
					if (segs[0] === "pron" && segs.length >= 2) {
						tset.add(`group:${segs[0]}.${segs[1]}`)
					}
				}
			}
			if (Array.isArray(maybe)) maybe.forEach(addWord)
			else addWord(maybe as WordObject | string | undefined)
		}
		sentenceTopics.set(s.id, tset)
		for (const topic of tset) push(topic, s.id)
	}

	const version = hashVersion(sentences.length, topicToSentences.size)

	_index = {
		topicToSentences: new Map(
			Array.from(topicToSentences.entries()).map(([k, set]) => [
				k,
				Array.from(set),
			])
		),
		sentenceTopics,
		sentences,
		version,
	}
	return _index
}

function hashVersion(sentences: number, topics: number): string {
	const h = crypto.createHash("sha1")
	h.update(String(sentences))
	h.update(":")
	h.update(String(topics))
	return h.digest("hex").slice(0, 12)
}

function buildTopicTree(ctx: TopicBuildContext): TopicNode[] {
	const nodes: TopicNode[] = []

	const simpleWordGroup = (prefix: string, g: WordGroup): TopicNode => {
		return {
			id: `group:${prefix}`,
			label: g.name || prefix,
			info: g.info || [],
			children: Object.values(g.words || {}).map((w: WordObject) => ({
				id: `word:${w.id}`,
				label: w.word,
				info: w.info || [],
			})),
		}
	}

	nodes.push(simpleWordGroup("artcl", ctx.artcl))
	nodes.push(simpleWordGroup("conj", ctx.conj))
	nodes.push(simpleWordGroup("prep", ctx.prep))
	nodes.push(simpleWordGroup("advrb", ctx.advrb))
	nodes.push(simpleWordGroup("noun", ctx.noun))

	// Pronouns (nested)
	const pronChildren: TopicNode[] = []
	const pronGroupParts: Array<keyof PronounGroup> = [
		"demonstrative",
		"interrogative",
		"subject",
		"dObj",
	]
	pronGroupParts.forEach((part) => {
		const seg = (ctx.pron as PronounGroup)[part] as WordGroup | undefined
		if (!seg) return
		pronChildren.push({
			id: `group:pron.${part}`,
			label: seg.name || part,
			info: seg.info || [],
			children: Object.values(seg.words || {}).map((w: WordObject) => ({
				id: `word:${w.id}`,
				label: w.word,
				info: w.info || [],
			})),
		})
	})
	nodes.push({
		id: "group:pron",
		label: ctx.pron.name,
		info: ctx.pron.info,
		children: pronChildren,
	})

	// Verbs: treat roots; inside verbGroup.words each root has present/past maps etc.
	const verbChildren: TopicNode[] = Object.values(ctx.verb.words || {}).map(
		(root) => {
			const r = root as VerbRoot
			return { id: `word:${r.id}`, label: r.word, info: r.info || [] }
		}
	)
	nodes.push({
		id: "group:verb",
		label: ctx.verb.name,
		info: ctx.verb.info,
		children: verbChildren,
	})

	return nodes
}
