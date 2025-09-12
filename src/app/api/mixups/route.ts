import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url)
		const userId = searchParams.get("userId")
		const page = Math.max(Number(searchParams.get("page") || 1), 1)
		const limit = Math.min(
			Math.max(Number(searchParams.get("limit") || 50), 1),
			500
		)
		const offset = (page - 1) * limit
		const format = searchParams.get("format") || "json"
		if (!userId)
			return NextResponse.json({ error: "userId required" }, { status: 400 })

		// Query aggregated mixups for user
		// Provide graceful error if delegate missing (e.g., build mismatch)
		interface UserMixupFindManyArgs {
			where: { userId: string }
			orderBy: { count: "desc" }
			skip: number
			take: number
		}
		interface UserMixupDelegate {
			findMany(args: UserMixupFindManyArgs): Promise<
				{
					expected: string
					wrong: string
					count: number
					updatedAt: Date
				}[]
			>
		}
		const delegate = (prisma as unknown as { userMixup?: UserMixupDelegate })
			.userMixup
		if (!delegate) {
			// Graceful fallback: return empty rows with warning instead of 500
			return NextResponse.json({ rows: [], warning: "mixup model missing" })
		}
		const rows = await delegate.findMany({
			where: { userId },
			orderBy: { count: "desc" },
			skip: offset,
			take: limit,
		})

		if (format === "csv") {
			const header = "expected,wrong,count,updatedAt\n"
			const lines = rows
				.map(
					(r: {
						expected: string
						wrong: string
						count: number
						updatedAt: Date
					}) =>
						`${r.expected},"${String(r.wrong).replace(/"/g, '""')}",${
							r.count
						},${r.updatedAt.toISOString()}`
				)
				.join("\n")
			return new NextResponse(header + lines, {
				status: 200,
				headers: {
					"Content-Type": "text/csv",
					"Content-Disposition": `attachment; filename="mixups_${userId}.csv"`,
				},
			})
		}

		return NextResponse.json({ rows })
	} catch (err) {
		console.error("GET /api/mixups error", err)
		// Graceful fallback for anticipated runtime issues: surface message but keep 200
		return NextResponse.json({ rows: [], warning: "mixups unavailable" })
	}
}
