import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// Contract (POST): expects JSON body { userId: string, lessonNumber: number, summary: LessonSummaryShape }
// summary should at minimum include: correctCount, incorrectCount, totalSubmissions, references, ... (flexible)

export async function POST(req: NextRequest) {
	try {
		const data = await req.json()
		const { userId, lessonNumber, summary } = data || {}
		if (!userId || typeof userId !== "string") {
			return NextResponse.json({ error: "userId required" }, { status: 400 })
		}
		if (typeof lessonNumber !== "number") {
			return NextResponse.json(
				{ error: "lessonNumber must be number" },
				{ status: 400 }
			)
		}
		if (!summary || typeof summary !== "object") {
			return NextResponse.json(
				{ error: "summary object required" },
				{ status: 400 }
			)
		}

		// Ensure user exists (simple upsert with provided id)
		await prisma.user.upsert({
			where: { id: userId },
			update: {},
			create: { id: userId },
		})

		const attempt = await prisma.lessonAttempt.create({
			data: {
				userId,
				lessonNumber,
				correctCount: Number(summary.correctCount) || 0,
				incorrectCount: Number(summary.incorrectCount) || 0,
				totalSubmissions: Number(summary.totalSubmissions) || 0,
				references: Array.isArray(summary.references)
					? summary.references.map(String)
					: [],
				summary,
			},
		})

		return NextResponse.json({ attempt }, { status: 201 })
	} catch (err: unknown) {
		console.error("POST /api/lessonAttempts error", err)
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		)
	}
}

// GET /api/lessonAttempts?userId=...&limit=10  -> recent attempts (newest first)
export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url)
		const userId = searchParams.get("userId")
		const limitParam = searchParams.get("limit")
		const limit = Math.min(Math.max(Number(limitParam) || 10, 1), 100)
		if (!userId) {
			return NextResponse.json(
				{ error: "userId query param required" },
				{ status: 400 }
			)
		}
		const attempts = await prisma.lessonAttempt.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
			take: limit,
		})
		return NextResponse.json({ attempts })
	} catch (err: unknown) {
		console.error("GET /api/lessonAttempts error", err)
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		)
	}
}

// DELETE /api/lessonAttempts?userId=...  -> remove all attempts for user (dev only)
export async function DELETE(req: NextRequest) {
	try {
		if (process.env.NODE_ENV !== "development") {
			return NextResponse.json(
				{ error: "Not allowed in production" },
				{ status: 403 }
			)
		}
		const { searchParams } = new URL(req.url)
		const userId = searchParams.get("userId")
		const attemptId = searchParams.get("attemptId")
		const lessonParam = searchParams.get("lessonNumber")
		const lessonNumber = lessonParam ? Number(lessonParam) : undefined
		if (!userId) {
			return NextResponse.json(
				{ error: "userId query param required" },
				{ status: 400 }
			)
		}
		if (attemptId) {
			const deleted = await prisma.lessonAttempt.deleteMany({
				where: { id: attemptId, userId },
			})
			return NextResponse.json({ deleted: deleted.count, scope: "attempt" })
		}
		const where: { userId: string; lessonNumber?: number } = { userId }
		if (typeof lessonNumber === "number" && !Number.isNaN(lessonNumber)) {
			where.lessonNumber = lessonNumber
		}
		const result = await prisma.lessonAttempt.deleteMany({ where })
		return NextResponse.json({
			deleted: result.count,
			scope: where.lessonNumber ? "lesson" : "all",
		})
	} catch (err) {
		console.error("DELETE /api/lessonAttempts error", err)
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		)
	}
}
