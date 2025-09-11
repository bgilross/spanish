"use client"

import React from "react"
import { resolveReference, resolveReferenceList } from "@/lib/refs"
import type { SubmissionLog } from "@/data/types"
import { useDataStore } from "@/data/dataStore"
import { APP_VERSION } from "@/lib/version"

type Summary = {
	lessonNumber: number
	correctCount: number
	incorrectCount: number
	totalSubmissions: number
	correct: SubmissionLog[]
	incorrect: Array<
		SubmissionLog & { expected?: string[]; references?: string[] }
	>
	references: string[]
}

type SaveStatus =
	| { state: "idle" }
	| { state: "saving" }
	| { state: "saved"; id?: string }
	| { state: "error"; message: string }

type Props = {
	open: boolean
	onClose: () => void
	summary: Summary
	saveStatus?: SaveStatus
}
const SummaryModal: React.FC<Props> = ({
	open,
	onClose,
	summary,
	saveStatus,
}) => {
	const markSubmissionCorrect = useDataStore((s) => s.markSubmissionCorrect)
	const getLessonSummary = useDataStore((s) => s.getLessonSummary)

	const [localSummary, setLocalSummary] = React.useState(summary)

	React.useEffect(() => setLocalSummary(summary), [summary])
	if (!open) return null
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div
				className="absolute inset-0 bg-black/50"
				onClick={onClose}
			/>
			<div className="relative bg-white text-black dark:bg-zinc-900 dark:text-zinc-50 shadow-xl rounded-lg max-w-3xl w-[90%] p-4">
				<div className="flex items-center justify-between mb-2">
					<h3 className="text-lg font-semibold flex items-center gap-2">
						Lesson {summary.lessonNumber} Summary
						<span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 font-mono">
							v{APP_VERSION}
						</span>
					</h3>
					<button
						className="px-2 py-1 text-sm border rounded"
						onClick={onClose}
					>
						Close
					</button>
				</div>
				{saveStatus && (
					<div className="mb-3 text-xs">
						{saveStatus.state === "saving" && (
							<div className="px-2 py-1 rounded bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100 inline-block">
								Saving attempt…
							</div>
						)}
						{saveStatus.state === "saved" && (
							<div className="px-2 py-1 rounded bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100 inline-block">
								Saved{saveStatus.id ? ` (#${saveStatus.id.slice(0, 8)})` : ""}
							</div>
						)}
						{saveStatus.state === "error" && (
							<div className="px-2 py-1 rounded bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100 inline-block">
								Save failed: {saveStatus.message}
							</div>
						)}
					</div>
				)}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
					<div className="p-2 border rounded">
						<div className="font-medium">Total</div>
						<div>{summary.totalSubmissions}</div>
					</div>
					<div className="p-2 border rounded">
						<div className="font-medium text-green-700">Correct</div>
						<div>{summary.correctCount}</div>
					</div>
					<div className="p-2 border rounded">
						<div className="font-medium text-red-700">Incorrect</div>
						<div>{summary.incorrectCount}</div>
					</div>
				</div>
				{summary.references.length > 0 && (
					<div className="mt-3">
						<div className="font-semibold">Common references to review</div>
						<ul className="list-disc ml-5 text-sm">
							{summary.references.map((r, idx) => {
								const rr = resolveReference(r)
								return (
									<li key={idx}>
										<div>{rr.label}</div>
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
					</div>
				)}
				<div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[40vh] overflow-auto">
					<div>
						<div className="font-semibold mb-1">Incorrect</div>
						<ul className="text-sm space-y-2">
							{summary.incorrect.length === 0 && (
								<li className="text-zinc-500">None</li>
							)}
							{localSummary.incorrect.map((s, i) => (
								<li
									key={i}
									className="p-2 border rounded"
								>
									<div className="font-medium">{s.sentence.sentence}</div>
									<div>Phrase: {s.section.phrase}</div>
									<div>Your input: “{s.userInput}”</div>
									<div>Expected: {s.expected?.join(" | ")}</div>
									<div className="mt-2 flex gap-2">
										<button
											className="px-2 py-1 text-xs rounded border bg-emerald-600 text-white"
											onClick={() => {
												if (!s.id) return
												markSubmissionCorrect(s.id)
												// refresh local summary
												const refreshed = getLessonSummary()
												setLocalSummary(refreshed)
											}}
										>
											Mark correct
										</button>
									</div>
									{s.references && s.references.length > 0 && (
										<div className="text-xs text-zinc-600 mt-1">
											<div className="font-semibold text-[0.8rem] mb-0.5">
												References
											</div>
											<ul className="list-disc ml-5">
												{resolveReferenceList(
													(
														s.section as {
															reference?: Record<string, (number | string)[]>
														}
													).reference
												)?.map((rr, k) => (
													<li key={k}>
														<div>{rr.label}</div>
														{rr.info && rr.info.length > 0 && (
															<ul className="list-disc ml-5">
																{rr.info.map((line, i) => (
																	<li key={i}>{line}</li>
																))}
															</ul>
														)}
													</li>
												))}
											</ul>
										</div>
									)}
								</li>
							))}
						</ul>
					</div>
					<div>
						<div className="font-semibold mb-1">Correct</div>
						<ul className="text-sm space-y-2">
							{summary.correct.length === 0 && (
								<li className="text-zinc-500">None</li>
							)}
							{summary.correct.map((s, i) => (
								<li
									key={i}
									className="p-2 border rounded"
								>
									<div className="font-medium">{s.sentence.sentence}</div>
									<div>Phrase: {s.section.phrase}</div>
									<div>Input: “{s.userInput}”</div>
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>
		</div>
	)
}

export default SummaryModal
