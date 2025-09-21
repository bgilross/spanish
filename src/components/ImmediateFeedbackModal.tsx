"use client"

import React from "react"
import { expectedAnswers } from "@/lib/translation"
import { getVerbFeedback } from "@/lib/verbErrors"
import { resolveReferenceList } from "@/lib/refs"
import type { Sentence, SentenceDataEntry } from "@/data/types"

export interface ImmediateFeedbackModalProps {
	open: boolean
	sentence: Sentence | null
	section: SentenceDataEntry | null
	userInput: string
	onClose: () => void
	onRetry: () => void
	onReveal: () => void
	revealed: boolean
	autoFocus?: boolean
}

const ImmediateFeedbackModal: React.FC<ImmediateFeedbackModalProps> = ({
	open,
	sentence,
	section,
	userInput,
	onClose,
	onRetry,
	onReveal,
	revealed,
	autoFocus = true,
}) => {
	const expected = section ? expectedAnswers(section) : []
	const verbFeedback = React.useMemo(() => {
		if (!section) return []
		return getVerbFeedback(section, userInput)
	}, [section, userInput])
	React.useEffect(() => {
		if (!open || !autoFocus) return
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose()
		}
		window.addEventListener("keydown", handler)
		return () => window.removeEventListener("keydown", handler)
	}, [open, onClose, autoFocus])
	if (!open) return null
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			/>
			<div className="relative w-[92%] max-w-lg bg-zinc-900 text-zinc-100 border border-zinc-700 rounded-xl shadow-2xl p-5 animate-fade-in">
				<h3 className="text-lg font-semibold mb-1">Incorrect</h3>
				{sentence && (
					<p className="text-xs text-zinc-400 mb-2">
						Sentence: <span className="text-zinc-200">{sentence.sentence}</span>
					</p>
				)}
				{section && (
					<p className="text-xs text-zinc-400 mb-3">
						Phrase: <span className="text-zinc-200">{section.phrase}</span>
					</p>
				)}
				<div className="mb-4">
					<div className="text-sm mb-1 text-zinc-300">Your answer:</div>
					<div className="px-3 py-2 rounded bg-zinc-800 text-rose-300 font-mono text-sm break-all border border-rose-700/40">
						{userInput || <span className="opacity-50 italic">(empty)</span>}
					</div>
				</div>
				{/* Show quick analysis chips if we detected a verb-related pattern */}
				{verbFeedback.length > 0 && (
					<div className="mb-3 flex flex-wrap gap-2">
						{verbFeedback.map((fb, i) => (
							<span
								key={i}
								className="px-2 py-0.5 rounded-full text-[11px] border border-amber-500/50 text-amber-300 bg-amber-900/20"
							>
								{fb.title}
							</span>
						))}
					</div>
				)}

				<div className="flex flex-wrap gap-2 items-center mb-4">
					{!revealed && (
						<button
							onClick={onReveal}
							className="px-3 py-1.5 text-xs rounded border border-emerald-600 text-emerald-300 hover:bg-emerald-700/30 transition"
						>
							Show hint
						</button>
					)}
					<button
						onClick={onRetry}
						className="px-3 py-1.5 text-xs rounded border border-indigo-600 text-indigo-300 hover:bg-indigo-700/30 transition"
					>
						Try again
					</button>
					<button
						onClick={onClose}
						className="px-3 py-1.5 text-xs rounded border border-zinc-600 text-zinc-300 hover:bg-zinc-700/40 transition ml-auto"
					>
						Close
					</button>
				</div>
				{revealed && (
					<div className="mt-4">
						<div className="text-sm font-medium text-emerald-400 mb-1">
							Expected answer{expected.length === 1 ? "" : "s"}:
						</div>
						{expected.length === 0 ? (
							<div className="text-xs text-zinc-500">
								(No registered answers)
							</div>
						) : (
							<ul className="list-disc ml-5 space-y-1 text-xs text-zinc-200">
								{expected.slice(0, 15).map((ans, i) => (
									<li
										key={i}
										className="font-mono tracking-wide"
									>
										{ans}
									</li>
								))}
							</ul>
						)}
						{/* Verb feedback details */}
						{verbFeedback.length > 0 && (
							<div className="mt-3">
								<div className="text-sm font-medium text-amber-300 mb-1">
									Why this was wrong (verb)
								</div>
								<ul className="list-disc ml-5 text-xs text-zinc-200">
									{verbFeedback.map((fb, i) => (
										<li
											key={i}
											className="mb-2"
										>
											<div className="font-medium">{fb.title}</div>
											{fb.details?.length ? (
												<ul className="list-disc ml-5 text-xs text-zinc-300">
													{fb.details.map((d, j) => (
														<li key={j}>{d}</li>
													))}
												</ul>
											) : null}
										</li>
									))}
								</ul>
							</div>
						)}

						{/* Show references if the section included any */}
						{section && "reference" in section && section.reference && (
							<div className="mt-3">
								<div className="text-sm font-medium text-amber-300 mb-1">
									Reference
								</div>
								<ul className="list-disc ml-5 text-sm text-zinc-200">
									{resolveReferenceList(section.reference).map((r, idx) => (
										<li
											key={idx}
											className="mb-2"
										>
											<div className="font-medium">{r.label}</div>
											{r.info && r.info.length > 0 && (
												<ul className="list-disc ml-5 text-xs text-zinc-300">
													{r.info.map((line, i) => (
														<li key={i}>{line}</li>
													))}
												</ul>
											)}
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	)
}

export default ImmediateFeedbackModal
