"use client"

import React from "react"
import { resolveReferenceList, resolveReference } from "@/lib/refs"
import { getVerbFeedback } from "@/lib/verbErrors"
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
	// Emit global modal open/close events so inputs can blur on modal open
	const nextBtnRef = React.useRef<HTMLButtonElement | null>(null)
	React.useEffect(() => {
		if (!open) return
		// Notify other components (e.g., input) so they blur
		window.dispatchEvent(new Event("app:modal-open"))
		// Ensure any active input loses focus, then focus the Next button so
		// Enter works immediately without clicking the modal. We call focus
		// on a short timeout and retry to handle mobile keyboards / timing.
		try {
			if (
				typeof document !== "undefined" &&
				document.activeElement instanceof HTMLElement
			) {
				document.activeElement.blur()
			}
		} catch {}
		const t = window.setTimeout(() => {
			try {
				nextBtnRef.current?.focus({ preventScroll: true })
			} catch {}
			// second attempt for slow environments
			window.setTimeout(() => {
				try {
					nextBtnRef.current?.focus({ preventScroll: true })
				} catch {}
			}, 50)
		}, 10)
		return () => {
			window.clearTimeout(t)
			window.dispatchEvent(new Event("app:modal-close"))
		}
	}, [open])

	// When the modal is open, allow Enter to advance to the next sentence.
	// Ignore Enter presses when focus is inside inputs, textareas, selects or
	// contentEditable elements, and require no modifier keys.
	React.useEffect(() => {
		if (!open) return
		const handler = (e: KeyboardEvent) => {
			if (e.defaultPrevented) return
			if (e.key !== "Enter") return
			if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return
			const target = e.target as HTMLElement | null
			if (target) {
				const tag = target.tagName?.toUpperCase()
				if (
					tag === "INPUT" ||
					tag === "TEXTAREA" ||
					tag === "SELECT" ||
					target.isContentEditable
				) {
					return
				}
			}
			e.preventDefault()
			onNext()
		}
		window.addEventListener("keydown", handler)
		return () => window.removeEventListener("keydown", handler)
	}, [open, onNext])
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

	// Only collect referenced topics from submissions that were incorrect
	const refs = Array.from(
		new Set(
			submissions
				.filter((s) => !s.isCorrect)
				.flatMap((s) => getSectionReferences(s.section).map((r) => r.key))
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
					<div className="mb-3">
						<div className="text-sm text-zinc-300">{sentence.sentence}</div>
						{(() => {
							// Prefer whole-sentence translation when available
							if (!sentence) return null
							if (
								typeof sentence.translation === "string" &&
								sentence.translation.trim()
							) {
								return (
									<div className="mt-2 text-sm text-emerald-300">
										{sentence.translation}
									</div>
								)
							}
							// Fallback: assemble from per-entry translations (only use string translations)
							const dataEntries = (sentence as Sentence | undefined)?.data as
								| SentenceDataEntry[]
								| undefined
							if (Array.isArray(dataEntries)) {
								const parts = dataEntries
									.map((d) => {
										if (!d) return ""
										// phraseTranslation preferred
										if ("phraseTranslation" in d) {
											const pt = d.phraseTranslation
											if (typeof pt === "string") return pt
											if (Array.isArray(pt) && pt.length) return pt[0]
										}
										// fallback to string translation when available
										if ("translation" in d) {
											const tr = d.translation
											if (typeof tr === "string") return tr
										}
										return ""
									})
									.join(" ")
								if (parts.trim() !== "") {
									return (
										<div className="mt-2 text-sm text-emerald-300">{parts}</div>
									)
								}
							}
							return null
						})()}
					</div>
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

								{/* Verb feedback for incorrect answers */}
								{!s.isCorrect &&
									s.section &&
									(() => {
										const vf = getVerbFeedback(
											s.section as SentenceDataEntry,
											s.userInput
										)
										if (!vf || vf.length === 0) return null
										return (
											<div className="mt-2 text-xs text-zinc-200">
												<div className="font-medium text-amber-300">
													Why it was wrong (verb)
												</div>
												<ul className="list-disc ml-5">
													{vf.map((fb, k) => (
														<li
															key={k}
															className="mb-1"
														>
															<div className="font-medium">{fb.title}</div>
															{fb.details?.length ? (
																<ul className="list-disc ml-5 text-zinc-300">
																	{fb.details.map((d, di) => (
																		<li key={di}>{d}</li>
																	))}
																</ul>
															) : null}
														</li>
													))}
												</ul>
											</div>
										)
									})()}
								{/* show references attached to this section only for incorrect submissions */}
								{!s.isCorrect &&
									(() => {
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
						ref={nextBtnRef}
						onClick={() => {
							onNext()
						}}
						className="px-3 py-1.5 text-sm rounded border bg-emerald-600 text-white"
					>
						Next sentence
					</button>
					{/* Open Summary button removed per request */}
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
