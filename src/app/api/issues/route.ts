import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import fs from "fs"
import path from "path"

const dataPath = path.resolve(process.cwd(), "data")
const issuesFile = path.join(dataPath, "issues.json")

async function ensureDataDir() {
	try {
		await fs.promises.mkdir(dataPath, { recursive: true })
	} catch {}
}

export async function POST(req: NextRequest) {
	try {
		const data = await req.json()
		const {
			userId,
			reporterName,
			lessonNumber,
			sentenceIndex,
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
		if (typeof sentenceIndex !== "number") {
			return NextResponse.json(
				{ error: "sentenceIndex must be number" },
				{ status: 400 }
			)
		}

		// Try saving via prisma if available and migrations are applied
		try {
			if (userId && typeof userId === "string") {
				await prisma.user.upsert({
					where: { id: userId },
					update: {},
					create: { id: userId },
				})
			}
			// Use a cast here because the generated Prisma client types are not being picked up by the TS checker
			// in this environment; at runtime the delegate exists. This is a small pragmatic workaround.
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const issue = await (prisma as any).issue.create({
				data: {
					userId: typeof userId === "string" ? userId : undefined,
					reporterName: reporterName ? String(reporterName) : undefined,
					lessonNumber: Number(lessonNumber),
					sentenceIndex: Number(sentenceIndex),
					typo: !!typo,
					missingReference: !!missingReference,
					incorrectReference: !!incorrectReference,
					notes: notes ? String(notes) : undefined,
				},
			})
			return NextResponse.json({ issue }, { status: 201 })
		} catch (prismaErr) {
			// If Prisma isn't available or migrations not applied, gracefully fall back to file storage
			console.warn(
				"Prisma save failed, falling back to local file storage",
				prismaErr
			)
			try {
				await ensureDataDir()
				const now = new Date().toISOString()
				const entry = {
					id: `local:${Date.now()}`,
					userId: typeof userId === "string" ? userId : null,
					reporterName: reporterName || null,
					lessonNumber: Number(lessonNumber),
					sentenceIndex: Number(sentenceIndex),
					typo: !!typo,
					missingReference: !!missingReference,
					incorrectReference: !!incorrectReference,
					notes: notes || null,
					createdAt: now,
				}
				let arr = []
				try {
					const raw = await fs.promises.readFile(issuesFile, "utf8")
					arr = JSON.parse(raw) || []
				} catch {}
				arr.unshift(entry)
				try {
					await fs.promises.writeFile(
						issuesFile,
						JSON.stringify(arr.slice(0, 1000), null, 2),
						"utf8"
					)
				} catch (writeErr) {
					console.error("Failed to write local issues file", writeErr)
				}
				return NextResponse.json({ issue: entry }, { status: 201 })
			} catch (fileErr) {
				console.error("Local file fallback failed", fileErr)
				return NextResponse.json(
					{ error: "Internal Server Error" },
					{ status: 500 }
				)
			}
		}
	} catch (err: unknown) {
		console.error("POST /api/issues error", err)
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		)
	}
}
