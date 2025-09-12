import { NextResponse } from "next/server"
import { generateQuiz } from "@/lib/quiz/generate"
import type { QuizConfig } from "@/lib/quiz/types"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
	try {
		const body = (await req.json()) as Partial<QuizConfig>
		if (!body.questionCount || !Array.isArray(body.topics)) {
			return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
		}
		const capped = Math.min(50, Math.max(10, body.questionCount))
		const quiz = generateQuiz({
			questionCount: capped,
			topics: body.topics,
			seed: body.seed,
			boostTopics: Array.isArray(body.boostTopics)
				? body.boostTopics
				: undefined,
		})
		return NextResponse.json(quiz)
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : "Failed"
		return NextResponse.json({ error: msg }, { status: 500 })
	}
}
