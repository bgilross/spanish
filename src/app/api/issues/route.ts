/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
// Local file fallback removed: we now write all reports to the database.

export async function POST(req: NextRequest) {
	try {
		const data = await req.json()
		const {
			userId,
			reporterName,
			lessonNumber,
			sentenceIndex,
			sentenceId,
			wrongTranslation,
			other,
			typo,
			missingReference,
			incorrectReference,
			notes,
		} = data || {}

		if (typeof lessonNumber !== "number") {
			return NextResponse.json(
				{ error: "lessonNumber must be number" },
				{ status: 400 }
			)
		}
		// Accept sentenceId (preferred) or sentenceIndex for backward compatibility
		// For general/site feedback (lessonNumber === 0) we allow missing sentence info
		if (Number(lessonNumber) !== 0) {
			if (typeof sentenceId !== "number" && typeof sentenceIndex !== "number") {
				return NextResponse.json(
					{ error: "sentenceId or sentenceIndex must be a number" },
					{ status: 400 }
				)
			}
		}

		// Save via Prisma (required)
		try {
			let resolvedReporterName = reporterName
			if (userId && typeof userId === "string") {
				// Ensure the user exists and try to resolve a display name if none provided
				await prisma.user.upsert({
					where: { id: userId },
					update: {},
					create: { id: userId },
				})
				try {
					const u = await prisma.user.findUnique({ where: { id: userId } })
					if (u && !resolvedReporterName) {
						resolvedReporterName = u.name ?? u.email ?? resolvedReporterName
					}
				} catch (uErr) {
					console.warn("Failed to resolve user for reporterName", uErr)
				}
			}
			const issue = await (prisma as any).issue.create({
				data: {
					userId: typeof userId === "string" ? userId : undefined,
					reporterName: resolvedReporterName
						? String(resolvedReporterName)
						: undefined,
					lessonNumber: Number(lessonNumber),
					// For general/site feedback (lesson 0), explicitly store null. Otherwise, prefer sentenceId then sentenceIndex.
					sentenceIndex:
						Number(lessonNumber) === 0
							? null
							: typeof sentenceId === "number"
							? Number(sentenceId)
							: typeof sentenceIndex === "number"
							? Number(sentenceIndex)
							: null,
					typo: !!typo,
					missingReference: !!missingReference,
					incorrectReference: !!incorrectReference,
					wrongTranslation: !!wrongTranslation,
					other: !!other,
					reportContext:
						typeof data?.reportContext === "string"
							? String(data.reportContext)
							: undefined,
					notes: notes ? String(notes) : undefined,
				},
			})
			return NextResponse.json({ issue }, { status: 201 })
		} catch (prismaErr: any) {
			console.error("Prisma save failed", prismaErr)
			const payload =
				process.env.NODE_ENV === "development"
					? {
							error: "Database unavailable",
							code: prismaErr?.code,
							message: prismaErr?.message,
					  }
					: { error: "Database unavailable" }
			return NextResponse.json(payload, { status: 500 })
		}
	} catch (err: unknown) {
		console.error("POST /api/issues error", err)
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		)
	}
}

export async function GET() {
	try {
		const rows = await (prisma as any).issue.findMany({
			orderBy: { createdAt: "desc" },
			take: 1000,
		})
		const issues = (rows as any[]).map((r) => ({
			id: r.id,
			userId: r.userId ?? null,
			reporterName: r.reporterName ?? null,
			lessonNumber: r.lessonNumber,
			sentenceIndex: r.sentenceIndex ?? null,
			typo: !!r.typo,
			missingReference: !!r.missingReference,
			incorrectReference: !!r.incorrectReference,
			wrongTranslation: !!r.wrongTranslation,
			other: !!r.other,
			reportContext: r.reportContext ?? null,
			notes: r.notes ?? null,
			createdAt: r.createdAt ?? null,
		}))
		return NextResponse.json({ issues }, { status: 200 })
	} catch (err) {
		console.error("GET /api/issues failed", err)
		return NextResponse.json({ error: "Database unavailable" }, { status: 500 })
	}
}
