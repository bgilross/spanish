"use client"

import React from "react"
import { resolveReferenceList, resolveReference } from "@/lib/refs"
import type { SubmissionLog, Sentence, SentenceDataEntry } from "@/data/types"

export type SentenceCompleteProps = {
	open: boolean
	sentence?: Sentence | null
	submissions: SubmissionLog[]
	onClose: () => void
	onNext: () => void
}

const SentenceCompleteModal: React.FC<SentenceCompleteProps> = ({
	open,
	sentence,
	submissions,
	onClose,
	onNext,
}) => {
	if (!open) return null

	// Helper that returns resolved refs keys/info for a section (safe runtime checks)
	const getSectionReferences = (
		sec: SentenceDataEntry | undefined
	): Array<{ key: string; refs: Record<string, (number | string)[]> }> => {
		if (!sec || typeof sec !== "object") return []
		if (!("reference" in sec)) return []
		const maybe = sec as unknown as {
			reference?: Record<string, (number | string)[]>
		}
		if (!maybe.reference) return []
		return Object.keys(maybe.reference).map((k) => ({
			key: k,
			refs: maybe.reference!,
		}))
	}

	const refs = Array.from(
		new Set(
			submissions.flatMap((s) =>
				getSectionReferences(s.section).map((r) => r.key)
			)
		)
	)
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div
				className="absolute inset-0 bg-black/50"
				onClick={onClose}
			/>
			<div className="relative w-[92%] max-w-2xl bg-zinc-900 text-zinc-100 border border-zinc-700 rounded-xl shadow-2xl p-5">
				<div className="flex items-center justify-between mb-3">
					<h3 className="text-lg font-semibold">Sentence complete</h3>
					<button
						className="px-2 py-1 text-sm border rounded"
						onClick={onClose}
					>
						Close
					</button>
				</div>
				{sentence && (
					<div className="mb-3 text-sm text-zinc-300">{sentence.sentence}</div>
				)}
				<div className="mb-3">
					<div className="font-semibold text-sm mb-2">Submissions</div>
					<ul className="space-y-2 text-sm">
						{submissions.map((s, i) => (
							<li
								key={s.id || i}
								className="p-2 border rounded bg-zinc-800/40"
							>
								<div className="flex items-center justify-between">
									<div className="font-mono text-xs">{s.userInput}</div>
									<div
										className={
											s.isCorrect
												? "text-emerald-300 text-xs"
												: "text-rose-300 text-xs"
										}
									>
										{s.isCorrect ? "Correct" : "Incorrect"}
									</div>
								</div>
								{!s.isCorrect && (
									<div className="mt-2 text-xs text-zinc-300">
										Expected:{" "}
										{s.section
											? Array.isArray(
													(s.section as SentenceDataEntry).translation
											  )
												? "(see reference)"
												: "see below"
											: "-"}
									</div>
								)}
								{/* show references attached to this section */}
								{(() => {
									const list = getSectionReferences(s.section)
									if (list.length === 0) return null
									return (
										<div className="mt-2 text-xs text-zinc-400">
											<div className="font-medium text-amber-300">
												References
											</div>
											<ul className="list-disc ml-5 text-xs text-zinc-200">
												{list
													.flatMap((item) => resolveReferenceList(item.refs))
													.map((r, idx) => (
														<li
															key={idx}
															className="mb-1"
														>
															<div className="font-medium">{r.label}</div>
															{r.info && r.info.length > 0 && (
																<ul className="list-disc ml-5 text-xs text-zinc-300">
																	{r.info.map((ln, ii) => (
																		<li key={ii}>{ln}</li>
																	))}
																</ul>
															)}
														</li>
													))}
											</ul>
										</div>
									)
								})()}
							</li>
						))}
					</ul>
				</div>
				{refs.length > 0 && (
					<div className="mb-3">
						<div className="font-semibold text-sm">Referenced topics</div>
						<ul className="list-disc ml-5 text-sm text-zinc-200">
							{refs.map((k) => {
								const rr = resolveReference(k)
								return (
									<li
										key={k}
										className=""
									>
										{rr.label}
									</li>
								)
							})}
						</ul>
					</div>
				)}
				<div className="flex gap-2 mt-4">
					<button
						onClick={() => {
							onNext()
						}}
						className="px-3 py-1.5 text-sm rounded border bg-emerald-600 text-white"
					>
						Next sentence
					</button>
					<button
						onClick={() => {
							// try to open lesson summary in parent (MainPage holds summary state)
							const ev = new CustomEvent("openLessonSummary")
							window.dispatchEvent(ev)
						}}
						className="px-3 py-1.5 text-sm rounded border"
					>
						Open Summary
					</button>
					<button
						onClick={onClose}
						className="px-3 py-1.5 text-sm rounded border"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	)
}

export default SentenceCompleteModal
