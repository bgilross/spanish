"use client"

import React from "react"
import type { SentenceDataEntry } from "@/data/types"
import { spanishTarget, spanishWordCount } from "@/lib/translation"

type Props = {
	currentLessonIndex: number
	currentSentenceIndex: number
	sentenceText?: string
	activeIndex: number | null
	currentSentenceData?: SentenceDataEntry[]
	translationSections: Array<{ index: number; isTranslated: boolean }>
}

function formatPhraseTranslation(entry: SentenceDataEntry): string | null {
	const pt = (entry as { phraseTranslation?: unknown }).phraseTranslation
	if (typeof pt === "string") return pt
	if (Array.isArray(pt)) {
		const vals = pt.filter((x): x is string => typeof x === "string")
		return vals.length ? vals.join(" | ") : null
	}
	return null
}

const DebugPanel: React.FC<Props> = ({
	currentLessonIndex,
	currentSentenceIndex,
	sentenceText,
	activeIndex,
	currentSentenceData,
	translationSections,
}) => {
	return (
		<details
			open
			className="mt-6"
		>
			<summary className="cursor-pointer">Debug</summary>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<h4 className="font-semibold mb-1">Active</h4>
					<div className="text-sm">
						<div>Lesson: {currentLessonIndex + 1}</div>
						<div>Sentence #: {currentSentenceIndex + 1}</div>
						<div>Sentence: {sentenceText}</div>
						<div>Active Section Index: {activeIndex ?? "-"}</div>
						{activeIndex != null &&
							currentSentenceData &&
							(() => {
								const entry = currentSentenceData[activeIndex]
								if (!entry) return null
								const target = spanishTarget(entry) ?? ""
								const count = spanishWordCount(entry)
								const pt = formatPhraseTranslation(entry)
								return (
									<div className="mt-1">
										<div>Phrase: {entry.phrase}</div>
										{pt && <div>Phrase Translation (priority): {pt}</div>}
										<div>Target (Spanish): {target}</div>
										<div>Expected words: {count}</div>
									</div>
								)
							})()}
					</div>
				</div>
				<div>
					<h4 className="font-semibold mb-1">Progress</h4>
					<ul className="text-sm list-disc ml-5">
						{translationSections.map((s) => {
							const entry = currentSentenceData?.[s.index]
							const pt = entry ? formatPhraseTranslation(entry) : null
							return (
								<li key={s.index}>
									#{s.index + 1}: {entry?.phrase}
									{pt ? ` — ${pt}` : ""} -{" "}
									{s.isTranslated ? "translated" : "pending"}
								</li>
							)
						})}
					</ul>
					<div className="text-sm mt-1">
						All translated:{" "}
						{translationSections.every((s) => s.isTranslated) ? "yes" : "no"}
					</div>
				</div>
			</div>
		</details>
	)
}

export default DebugPanel
