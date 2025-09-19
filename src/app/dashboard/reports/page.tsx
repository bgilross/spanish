/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import React from "react"
import fs from "fs"
import path from "path"
import prisma from "@/lib/prisma"

type Issue = {
	id: string
	userId?: string | null
	reporterName?: string | null
	lessonNumber: number
	sentenceId?: number
	sentenceIndex?: number
	typo: boolean
	missingReference: boolean
	incorrectReference: boolean
	wrongTranslation?: boolean
	other?: boolean
	notes?: string | null
	createdAt?: string | null
}

async function readLocalIssues(): Promise<Issue[]> {
	const dataPath = path.resolve(process.cwd(), "data")
	const issuesFile = path.join(dataPath, "issues.json")
	try {
		const raw = await fs.promises.readFile(issuesFile, "utf8")
		const arr = JSON.parse(raw) || []
		return arr.map((it: any) => ({
			...it,
			wrongTranslation: !!it.wrongTranslation,
			other: !!it.other,
		}))
	} catch {
		return []
	}
}

async function readDbIssues(): Promise<Issue[]> {
	try {
		// Prisma client types may not be available to the server build here; cast pragmatically
		const rows = await (prisma as any).issue.findMany({
			orderBy: { createdAt: "desc" },
			take: 1000,
		})
		return (rows as any[]).map((r) => ({
			id: r.id,
			userId: r.userId ?? null,
			reporterName: r.reporterName ?? null,
			lessonNumber: r.lessonNumber,
			sentenceIndex: r.sentenceIndex,
			typo: !!r.typo,
			missingReference: !!r.missingReference,
			incorrectReference: !!r.incorrectReference,
			notes: r.notes ?? null,
			wrongTranslation: !!r.wrongTranslation,
			other: !!r.other,
			createdAt: r.createdAt ? r.createdAt.toISOString() : null,
		}))
	} catch (err) {
		console.warn("Prisma read failed, falling back to local issues file", err)
		return []
	}
}

export default async function ReportsPage() {
	let issues = await readDbIssues()
	if (!issues || issues.length === 0) {
		issues = await readLocalIssues()
	}

	return (
		<div className="p-6">
			<h1 className="text-2xl font-semibold mb-4">User submitted reports</h1>
			<p className="text-sm text-zinc-400 mb-4">
				Source: {issues.length > 0 ? "DB / file" : "none"}
			</p>
			<div className="mb-4">
				<div className="text-xs text-zinc-500 mb-2">
					Tip: fetch{" "}
					<code className="bg-zinc-800 px-1 rounded">/api/issues</code> for raw
					JSON.
				</div>
			</div>
			{issues.length === 0 ? (
				<div className="text-zinc-500">No reports found.</div>
			) : (
				<ul className="space-y-3">
					{issues.map((it) => (
						<li
							key={it.id}
							className="p-3 border rounded bg-zinc-900/40"
						>
							<div className="flex items-center justify-between">
								<div className="text-sm font-medium">
									{it.reporterName ?? "(anonymous)"}
								</div>
								<div className="text-xs text-zinc-400">
									{it.createdAt ?? ""}
								</div>
							</div>
							<div className="text-xs text-zinc-300 mt-1">
								Lesson {it.lessonNumber} — sentence{" "}
								{it.sentenceId ?? it.sentenceIndex}
							</div>
							<div className="text-xs mt-2">Notes: {it.notes ?? "—"}</div>
							<div className="text-xs mt-2 text-zinc-400">
								Flags: {it.typo ? "typo " : ""}
								{it.missingReference ? "missingRef " : ""}
								{it.incorrectReference ? "incorrectRef" : ""}
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	)
}
