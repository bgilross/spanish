import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET /api/lessonAttempts/analyze?userId=...&lessonNumber=...&limit=5
// Returns comparative analytics across recent attempts of a lesson.
export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url)
		const userId = searchParams.get("userId")
		const lessonNumberParam = searchParams.get("lessonNumber")
		const limitParam = searchParams.get("limit")
		if (!userId) {
			return NextResponse.json({ error: "userId required" }, { status: 400 })
		}
		if (!lessonNumberParam) {
			return NextResponse.json(
				{ error: "lessonNumber required" },
				{ status: 400 }
			)
		}
		const lessonNumber = Number(lessonNumberParam)
		const limit = Math.min(Math.max(Number(limitParam) || 5, 1), 25)

		const attempts = await prisma.lessonAttempt.findMany({
			where: { userId, lessonNumber },
			orderBy: { createdAt: "desc" },
			take: limit,
		})

		// Extract summaries (stored as Json)
		interface IncorrectEntry {
			sentenceIndex: number
			sectionIndex: number
			references?: string[]
		}
		interface StoredSummary {
			incorrect?: IncorrectEntry[]
			errorCategoryCounts?: Record<string, number>
		}
		const summaries: StoredSummary[] = attempts.map(
			(a: (typeof attempts)[number]) => a.summary as StoredSummary
		)

		// Aggregate error categories & repetition stats
		const categoryTrend: Record<string, number[]> = {}
		const attemptTimestamps: string[] = []

		summaries.forEach((s, idx) => {
			attemptTimestamps.push(attempts[idx].createdAt.toISOString())
			const catCounts: Record<string, number> = s.errorCategoryCounts || {}
			const allKeys = Object.keys(catCounts)
			for (const k of allKeys) {
				if (!categoryTrend[k]) categoryTrend[k] = []
			}
			// Ensure alignment length for all existing keys
			for (const k of Object.keys(categoryTrend)) {
				categoryTrend[k].push(catCounts[k] || 0)
			}
		})

		// Identify persistent problem sections (same sentence+section repeatedly incorrect)
		const sectionErrorHistory: Record<string, number> = {}
		summaries.forEach((s) => {
			const incorrect = s.incorrect || []
			incorrect.forEach((inc: IncorrectEntry) => {
				const key = `${inc.sentenceIndex}:${inc.sectionIndex}`
				sectionErrorHistory[key] = (sectionErrorHistory[key] || 0) + 1
			})
		})

		const persistentProblems = Object.entries(sectionErrorHistory)
			.filter(([, count]) => count > 1)
			.map(([key, count]) => {
				const [sentenceIndex, sectionIndex] = key.split(":").map(Number)
				return { sentenceIndex, sectionIndex, count }
			})
			.sort((a, b) => b.count - a.count)

		return NextResponse.json({
			attempts: attempts.length,
			attemptTimestamps,
			categoryTrend, // per category counts aligned oldest->newest
			persistentProblems,
		})
	} catch (err) {
		console.error("GET /api/lessonAttempts/analyze error", err)
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		)
	}
}
