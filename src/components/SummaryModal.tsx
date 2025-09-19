"use client"

import React from "react"
import { resolveReferenceList, resolveReference } from "@/lib/refs"
import { useDataStore } from "@/data/dataStore"
import type { SubmissionLog } from "@/data/types"

type MixupMap = Record<string, Record<string, number>>

function computeMixupsFromMapStatic(
	mixupMap?: MixupMap,
	fallback?: () => Array<{ expected: string; wrong: string; count: number }>
) {
	if (!mixupMap) return fallback ? fallback() : []
	const rows: Array<{ expected: string; wrong: string; count: number }> = []
	for (const exp of Object.keys(mixupMap)) {
		for (const wrong of Object.keys(mixupMap[exp] || {})) {
			rows.push({ expected: exp, wrong, count: mixupMap[exp][wrong] })
		}
	}
	rows.sort((a, b) => b.count - a.count)
	return rows
}

interface LessonSummary {
	lessonNumber: number
	correctCount: number
	incorrectCount: number
	totalSubmissions: number
	correct: SubmissionLog[]
	incorrect: Array<
		SubmissionLog & { expected?: string[]; references?: string[] }
	>
	references?: string[]
}

interface Props {
	open: boolean
	onClose: () => void
	summary: LessonSummary
	saveStatus: {
		state: "idle" | "saving" | "saved" | "error"
		message?: string
		id?: string
	}
}

const SummaryModal: React.FC<Props> = ({
	open,
	onClose,
	summary,
	saveStatus,
}) => {
	// Emit global modal open/close events so other UI (like input) can react
	React.useEffect(() => {
		if (!open) return
		window.dispatchEvent(new Event("app:modal-open"))
		return () => {
			window.dispatchEvent(new Event("app:modal-close"))
		}
	}, [open])
	const getLessonSummary = useDataStore((s) => s.getLessonSummary)
	const markSubmissionCorrect = useDataStore((s) => s.markSubmissionCorrect)
	const getMixupStats = useDataStore((s) => s.getMixupStats)
	const clearMixups = useDataStore((s) => s.clearMixups)

	const [localSummary, setLocalSummary] = React.useState<LessonSummary>(summary)

	const [mixups, setMixups] = React.useState(() =>
		computeMixupsFromMapStatic(
			(summary as unknown as { mixupMap?: MixupMap })?.mixupMap,
			getMixupStats
		)
	)

	// Extract mixupMap into a stable variable so the dependency array can be static
	const summaryMixupMap = (summary as unknown as { mixupMap?: MixupMap })
		?.mixupMap

	// Update localSummary when the lesson number changes (snapshot semantics)
	React.useEffect(() => {
		setLocalSummary(summary)
	}, [summary])

	// Update mixups when the per-summary mixupMap snapshot changes or store fallback changes
	React.useEffect(() => {
		setMixups(computeMixupsFromMapStatic(summaryMixupMap, getMixupStats))
	}, [summaryMixupMap, getMixupStats])

	if (!open) return null

	const handleMarkCorrect = (id?: string) => {
		if (!id) return
		markSubmissionCorrect(id)
		const refreshed = getLessonSummary()
		setLocalSummary(refreshed)
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div
				className="absolute inset-0 bg-black/60"
				onClick={onClose}
			/>
			<div className="relative max-h-[90vh] overflow-hidden flex flex-col w-[95%] max-w-5xl rounded-lg shadow-xl bg-zinc-950 border border-zinc-700 text-zinc-100">
				<div className="px-4 py-3 border-b border-zinc-700 flex items-center justify-between gap-3">
					<h2 className="text-lg font-semibold">
						Lesson Summary #{summary?.lessonNumber}
					</h2>
					<div className="flex items-center gap-2">
						{saveStatus.state === "saving" && (
							<span className="text-[10px] px-2 py-0.5 rounded bg-amber-800/60 text-amber-200">
								Saving…
							</span>
						)}
						{saveStatus.state === "saved" && (
							<span className="text-[10px] px-2 py-0.5 rounded bg-emerald-800/60 text-emerald-200">
								Saved{saveStatus.id ? ` #${saveStatus.id.slice(0, 8)}` : ""}
							</span>
						)}
						{saveStatus.state === "error" && (
							<button className="text-[10px] px-2 py-0.5 rounded bg-red-800/60 text-red-200 border border-red-600">
								Save Error
							</button>
						)}
						<button
							onClick={onClose}
							className="text-[10px] px-2 py-0.5 rounded border border-zinc-600 hover:bg-zinc-800"
						>
							Close
						</button>
					</div>
				</div>

				<div className="p-4 flex-1 overflow-hidden">
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-sm">
						<div className="rounded border border-zinc-700 p-2 bg-zinc-900/40 text-center">
							<div className="text-zinc-400">Correct</div>
							<div className="font-semibold text-emerald-400">
								{summary.correctCount}
							</div>
						</div>
						<div className="rounded border border-zinc-700 p-2 bg-zinc-900/40 text-center">
							<div className="text-zinc-400">Incorrect</div>
							<div className="font-semibold text-rose-400">
								{summary.incorrectCount}
							</div>
						</div>
						<div className="rounded border border-zinc-700 p-2 bg-zinc-900/40 text-center">
							<div className="text-zinc-400">Submissions</div>
							<div className="font-mono text-emerald-300">
								{summary.totalSubmissions}
							</div>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
						<div className="max-h-[60vh] overflow-auto">
							<div className="font-semibold mb-2">Incorrect</div>
							<ul className="space-y-3">
								{(localSummary.incorrect || []).length === 0 ? (
									<li className="text-zinc-500">None</li>
								) : (
									(localSummary.incorrect || []).map((s, i) => (
										<li
											key={i}
											className="p-2 border rounded"
										>
											<div className="font-medium">{s.sentence?.sentence}</div>
											<div className="text-xs">Phrase: {s.section?.phrase}</div>
											<div className="text-xs">Your input: “{s.userInput}”</div>
											<div className="text-xs">
												Expected: {s.expected?.join(" | ")}
											</div>
											<div className="mt-2 flex gap-2">
												<button
													className="px-2 py-1 text-xs rounded border bg-emerald-600 text-white"
													onClick={() => handleMarkCorrect(s.id)}
												>
													Mark correct
												</button>
											</div>
											{s.references && s.references.length > 0 && (
												<div className="text-xs text-zinc-600 mt-2">
													<div className="font-semibold text-[0.8rem] mb-1">
														References
													</div>
													<ul className="list-disc ml-5">
														{resolveReferenceList(
															(
																s.section as {
																	reference?: Record<
																		string,
																		(number | string)[]
																	>
																}
															).reference
														)?.map((rr, k) => {
															const title = rr.word
																? `${rr.groupName || rr.word.pos || "Word"} — ${
																		rr.word.word
																  }`
																: rr.groupName || rr.label
															return (
																<li key={k}>
																	<div className="font-medium">{title}</div>
																	{rr.info && rr.info.length > 0 && (
																		<ul className="list-disc ml-5">
																			{rr.info.map(
																				(line: string, idx: number) => (
																					<li key={idx}>{line}</li>
																				)
																			)}
																		</ul>
																	)}
																</li>
															)
														})}
													</ul>
												</div>
											)}
										</li>
									))
								)}
							</ul>
						</div>

						<div className="max-h-[60vh] overflow-auto space-y-4">
							<div>
								<div className="font-semibold mb-2">References</div>
								<div className="text-sm">
									{(localSummary.references || summary.references || [])
										.length === 0 ? (
										<div className="text-zinc-500">None</div>
									) : (
										<ul className="list-disc ml-5 space-y-1">
											{(
												localSummary.references ||
												summary.references ||
												[]
											).map((r, idx) => {
												const rr = resolveReference(r)
												const title = rr.word
													? `${rr.groupName || rr.word.pos || "Word"} — ${
															rr.word.word
													  }`
													: rr.groupName || rr.label
												return (
													<li
														key={idx}
														className="text-xs"
													>
														<div className="font-medium">{title}</div>
														{rr.info && rr.info.length > 0 && (
															<ul className="list-disc ml-5">
																{rr.info.map((line, i) => (
																	<li key={i}>{line}</li>
																))}
															</ul>
														)}
													</li>
												)
											})}
										</ul>
									)}
								</div>
							</div>

							<div>
								<div className="flex items-center justify-between">
									<div className="font-semibold mb-2">
										Mixups (common wrong answers)
									</div>
									<div>
										{/* Clearing mixups clears the global aggregate only; per-summary snapshot remains on saved attempt */}
										<button
											className="px-2 py-1 text-xs rounded border bg-zinc-100"
											onClick={() => {
												clearMixups()
												setMixups([])
											}}
										>
											Clear Mixups
										</button>
									</div>
								</div>
								<div className="text-sm">
									{mixups.length === 0 ? (
										<div className="text-zinc-500">No mixups recorded.</div>
									) : (
										// Group by expected token
										(() => {
											const groups: Record<
												string,
												{ wrong: string; count: number }[]
											> = {}
											for (const m of mixups) {
												if (!groups[m.expected]) groups[m.expected] = []
												groups[m.expected].push({
													wrong: m.wrong,
													count: m.count,
												})
											}
											return (
												<ul className="space-y-2">
													{Object.entries(groups).map(([expected, wrongs]) => (
														<li
															key={expected}
															className="border border-zinc-700 rounded p-2 bg-zinc-900/30"
														>
															<div className="flex items-center justify-between">
																<div className="font-medium">{expected}</div>
																<div className="text-zinc-400 text-xs">
																	{wrongs.reduce((a, b) => a + b.count, 0)}{" "}
																	total
																</div>
															</div>
															<ul className="mt-2 ml-4 list-decimal text-sm space-y-1">
																{wrongs.map((w) => (
																	<li
																		key={w.wrong}
																		className="flex justify-between"
																	>
																		<span>“{w.wrong}”</span>
																		<span className="text-zinc-400">
																			{w.count}
																		</span>
																	</li>
																))}
															</ul>
														</li>
													))}
												</ul>
											)
										})()
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default SummaryModal
