import { NextResponse } from "next/server"
import { getTopicTree } from "@/lib/quiz/index"

export const dynamic = "force-dynamic"

export async function GET() {
	const tree = getTopicTree()
	return NextResponse.json({ topics: tree, version: Date.now() })
}
