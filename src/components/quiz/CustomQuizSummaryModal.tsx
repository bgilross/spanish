"use client"
import React from "react"
import type { Sentence, SentenceDataEntry } from "@/data/types"
import { expectedAnswers } from "@/lib/translation"
import { APP_VERSION } from "@/lib/version"

// Using SubmissionLog directly; no extension needed.

export interface CustomQuizSummarySectionEntry {
	sentence: Sentence
	sentenceIndex: number
	sectionIndex: number
	section: SentenceDataEntry
	attempts: Array<{ id: string; userInput: string; correct: boolean }>
	expected: string[]
	references: string[]
	hadIncorrect: boolean
}

export interface CustomQuizSummaryData {
	quizKind: "custom"
	seed?: string
	topics: string[]
	coverage: Record<string, number>
	totalSubmissions: number
	correctCount: number
	incorrectCount: number
	references: string[]
	sections: CustomQuizSummarySectionEntry[]
	errorCategoryCounts: Record<string, number>
}

interface Props {
	open: boolean
	onClose: () => void
	summary: CustomQuizSummaryData
	onMarkCorrect: (
		sentenceIndex: number,
		sectionIndex: number,
		attemptId: string
	) => void
	saveStatus: {
		state: "idle" | "saving" | "saved" | "error"
		message?: string
		id?: string
	}
	onRetrySave: () => void
}

const CustomQuizSummaryModal: React.FC<Props> = ({
	open,
	onClose,
	summary,
	onMarkCorrect,
	saveStatus,
	onRetrySave,
}) => {
	if (!open) return null
	const { coverage, topics, seed } = summary
	const coverageList = Object.entries(coverage).sort((a, b) => b[1] - a[1])
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div
				className="absolute inset-0 bg-black/60"
				onClick={onClose}
			/>
			<div className="relative max-h-[90vh] overflow-hidden flex flex-col w-[95%] max-w-5xl rounded-lg shadow-xl bg-zinc-950 border border-zinc-700 text-zinc-100">
				<div className="px-4 py-3 border-b border-zinc-700 flex items-center justify-between gap-3">
					<h2 className="text-lg font-semibold flex items-center gap-2">
						Custom Quiz Summary
						<span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
							v{APP_VERSION}
						</span>
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
							<button
								onClick={onRetrySave}
								className="text-[10px] px-2 py-0.5 rounded bg-red-800/60 text-red-200 border border-red-600"
								title={saveStatus.message}
							>
								Retry Save
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
				<div className="p-4 overflow-y-auto space-y-6 text-sm">
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-[11px]">
						<div className="rounded border border-zinc-700 p-2 bg-zinc-900/40">
							<div className="text-zinc-400">Topics</div>
							<div className="font-semibold text-zinc-200">{topics.length}</div>
						</div>
						<div className="rounded border border-zinc-700 p-2 bg-zinc-900/40">
							<div className="text-zinc-400">Seed</div>
							<div className="font-mono text-[10px] truncate">
								{seed || "—"}
							</div>
						</div>
						<div className="rounded border border-zinc-700 p-2 bg-zinc-900/40">
							<div className="text-zinc-400">Correct</div>
							<div className="font-semibold text-emerald-400">
								{summary.correctCount}
							</div>
						</div>
						<div className="rounded border border-zinc-700 p-2 bg-zinc-900/40">
							<div className="text-zinc-400">Incorrect</div>
							<div className="font-semibold text-rose-400">
								{summary.incorrectCount}
							</div>
						</div>
					</div>
					<div>
						<p className="text-xs uppercase tracking-wide text-zinc-500 mb-1">
							Topic Coverage
						</p>
						{coverageList.length === 0 && (
							<p className="text-[11px] text-zinc-500">None</p>
						)}
						<ul className="space-y-1 max-h-40 overflow-auto pr-1">
							{coverageList.map(([t, c]) => (
								<li
									key={t}
									className="flex justify-between text-[11px] border border-zinc-700 rounded px-2 py-0.5 bg-zinc-900/40"
								>
									<span
										className="truncate pr-4"
										title={t}
									>
										{t}
									</span>
									<span className="font-mono text-emerald-300">{c}</span>
								</li>
							))}
						</ul>
					</div>
					<div className="grid md:grid-cols-2 gap-6">
						<div>
							<p className="text-xs uppercase tracking-wide text-zinc-500 mb-1">
								Sections With Errors
							</p>
							<ul className="space-y-2 max-h-72 overflow-auto pr-1">
								{summary.sections.filter((s) => s.hadIncorrect).length ===
									0 && <li className="text-[11px] text-zinc-500">None</li>}
								{summary.sections
									.filter((s) => s.hadIncorrect)
									.map((sec, i) => (
										<li
											key={i}
											className="border border-zinc-700 rounded p-2 bg-zinc-900/50 space-y-1"
										>
											<p className="font-medium text-[12px] text-zinc-200 break-words">
												Sentence {sec.sentenceIndex + 1}:{" "}
												<span className="text-zinc-400">
													{sec.sentence.sentence}
												</span>
											</p>
											<p className="text-[11px] text-zinc-300 break-words">
												<span className="text-zinc-500">Phrase:</span>{" "}
												{sec.section.phrase}
											</p>
											<p className="text-[10px] text-zinc-400 break-words">
												<span className="text-zinc-500">Expected:</span>{" "}
												{sec.expected.map((e) => (
													<span
														key={e}
														className="px-1 rounded bg-emerald-800/40 text-emerald-300 mr-1"
													>
														{e}
													</span>
												))}
											</p>
											<p className="text-[10px] text-zinc-400 break-words">
												<span className="text-zinc-500">Attempts:</span>{" "}
												{sec.attempts.map((a, j) => {
													const cls = a.correct
														? "bg-emerald-700/40 text-emerald-300"
														: "bg-rose-800/40 text-rose-300"
													return (
														<span
															key={a.id}
															className={`px-1 rounded mr-1 ${cls}`}
														>
															{j + 1}: {a.userInput}
														</span>
													)
												})}
											</p>
											<div className="flex flex-wrap gap-2 pt-1">
												{sec.attempts
													.filter((a) => !a.correct)
													.map((a) => (
														<button
															key={a.id}
															onClick={() =>
																onMarkCorrect(
																	sec.sentenceIndex,
																	sec.sectionIndex,
																	a.id
																)
															}
															className="text-[10px] px-1.5 py-0.5 rounded border border-emerald-600 text-emerald-300 hover:bg-emerald-900/40"
														>
															Mark Correct
														</button>
													))}
											</div>
										</li>
									))}
							</ul>
						</div>
						<div>
							<p className="text-xs uppercase tracking-wide text-zinc-500 mb-1">
								All Sections
							</p>
							<ul className="space-y-2 max-h-72 overflow-auto pr-1">
								{summary.sections.length === 0 && (
									<li className="text-[11px] text-zinc-500">None</li>
								)}
								{summary.sections.map((sec, i) => (
									<li
										key={i}
										className="border border-zinc-700 rounded p-2 bg-zinc-900/30 space-y-1"
									>
										<p className="text-[11px] break-words">
											<span className="text-zinc-500">
												Sentence {sec.sentenceIndex + 1}:
											</span>{" "}
											{sec.sentence.sentence}
										</p>
										<p className="text-[11px] text-zinc-300 break-words">
											<span className="text-zinc-500">Phrase:</span>{" "}
											{sec.section.phrase}
										</p>
										<p className="text-[10px] text-zinc-400 break-words">
											<span className="text-zinc-500">Attempts:</span>{" "}
											{sec.attempts.map((a, j) => {
												const cls = a.correct
													? "bg-emerald-700/40 text-emerald-300"
													: "bg-rose-800/40 text-rose-300"
												return (
													<span
														key={a.id}
														className={`px-1 rounded mr-1 ${cls}`}
													>
														{j + 1}: {a.userInput}
													</span>
												)
											})}
										</p>
									</li>
								))}
							</ul>
						</div>
					</div>
					{Object.keys(summary.errorCategoryCounts).length > 0 && (
						<div>
							<p className="text-xs uppercase tracking-wide text-zinc-500 mb-1">
								Error Categories
							</p>
							<ul className="text-[11px] space-y-1 max-h-40 overflow-auto pr-1">
								{Object.entries(summary.errorCategoryCounts)
									.sort((a, b) => b[1] - a[1])
									.map(([k, v]) => (
										<li
											key={k}
											className="flex justify-between border border-zinc-700 rounded px-2 py-0.5 bg-zinc-900/40"
										>
											<span
												className="truncate pr-4"
												title={k}
											>
												{k}
											</span>
											<span className="font-mono text-rose-300">{v}</span>
										</li>
									))}
							</ul>
						</div>
					)}
					<div className="pt-2 flex flex-wrap gap-2">
						<button
							onClick={onClose}
							className="text-[11px] px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-600"
						>
							Done
						</button>
						<a
							href="/dashboard"
							className="text-[11px] px-3 py-1.5 rounded bg-indigo-700/70 hover:bg-indigo-700 border border-indigo-600"
						>
							Dashboard
						</a>
					</div>
				</div>
			</div>
		</div>
	)
}

export function buildCustomQuizSummary(params: {
	submissions: Array<{
		id: string
		sentenceIndex: number
		sectionIndex: number
		sentence: Sentence
		section: SentenceDataEntry
		isCorrect: boolean
		userInput: string
	}>
	quizTopics: string[]
	seed?: string
	coverage: Record<string, number>
}): CustomQuizSummaryData {
	const { submissions, quizTopics, seed, coverage } = params
	const map = new Map<string, CustomQuizSummarySectionEntry>()
	for (const s of submissions) {
		const key = `${s.sentenceIndex}:${s.sectionIndex}`
		if (!map.has(key)) {
			const expected = expectedAnswers(s.section)
			const refsObj: Record<string, (number | string)[]> =
				(s.section as { reference?: Record<string, (number | string)[]> })
					.reference || {}
			const references = Object.keys(refsObj)
			map.set(key, {
				sentence: s.sentence,
				sentenceIndex: s.sentenceIndex,
				sectionIndex: s.sectionIndex,
				section: s.section,
				attempts: [],
				expected,
				references,
				hadIncorrect: false,
			})
		}
		const entry = map.get(key)!
		entry.attempts.push({
			id: s.id,
			userInput: s.userInput,
			correct: s.isCorrect,
		})
		if (!s.isCorrect) entry.hadIncorrect = true
	}
	const sections = Array.from(map.values()).sort(
		(a, b) =>
			a.sentenceIndex - b.sentenceIndex || a.sectionIndex - b.sectionIndex
	)
	const correctCount = submissions.filter((s) => s.isCorrect).length
	const incorrectCount = submissions.filter((s) => !s.isCorrect).length
	const references = Array.from(new Set(sections.flatMap((s) => s.references)))
	const errorCategoryCounts: Record<string, number> = {}
	sections.forEach((sec) => {
		if (sec.hadIncorrect) {
			sec.references.forEach((r) => {
				errorCategoryCounts[r] = (errorCategoryCounts[r] || 0) + 1
			})
		}
	})
	return {
		quizKind: "custom",
		seed,
		topics: quizTopics,
		coverage,
		totalSubmissions: submissions.length,
		correctCount,
		incorrectCount,
		references,
		sections,
		errorCategoryCounts,
	}
}

export default CustomQuizSummaryModal
