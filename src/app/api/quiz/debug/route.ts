import { NextResponse } from "next/server"
import {
	getSentenceTopicIndex,
	getTopicTree,
	resetQuizIndex,
} from "@/lib/quiz/index"
import type { TopicNode } from "@/lib/quiz/types"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url)
	const topicsFilter = searchParams.getAll("t") // ?t=group:prep&t=group:conj
	if (searchParams.get("reset") === "1") {
		resetQuizIndex()
	}
	const index = getSentenceTopicIndex()
	const tree = getTopicTree()

	// Flatten tree for lookup
	const flat: TopicNode[] = []
	const walk = (ns: TopicNode[]) =>
		ns.forEach((n) => {
			flat.push(n)
			if (n.children) walk(n.children)
		})
	walk(tree)
	const nodeMap = new Map(flat.map((n) => [n.id, n]))

	const allEntries = Array.from(index.topicToSentences.entries()).map(
		([id, arr]) => ({
			id,
			count: arr.length,
			label: nodeMap.get(id)?.pathLabel || nodeMap.get(id)?.label || null,
		})
	)

	const filtered = topicsFilter.length
		? allEntries.filter((e) => topicsFilter.includes(e.id))
		: undefined

	return NextResponse.json({
		reset: searchParams.get("reset") === "1" || undefined,
		version: index.version,
		topicCount: index.topicToSentences.size,
		sentenceCount: index.sentences.length,
		entries: filtered || allEntries,
	})
}
