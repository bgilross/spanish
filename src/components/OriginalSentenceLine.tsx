"use client"

import React from "react"
import { splitWordAndPunct } from "@/lib/text"
import type { Sentence } from "@/data/types"

interface Props {
	sentence: Sentence | undefined
	activeIndex: number | null
}

// Displays the full (untranslated/original) sentence while underlining the
// current section the user is expected to translate (activeIndex).
// Mirrors spacing / punctuation handling used in SentenceLine for consistency.
const OriginalSentenceLine: React.FC<Props> = ({ sentence, activeIndex }) => {
	if (!sentence) return null

	// Determine sentence-level formal flag and whether any part sets it
	const sentenceLevelFormal = sentence.isFormal
	const anyPartHasFormal = sentence.data.some(
		(p) => (p as { isFormal?: boolean }).isFormal === true
	)

	return (
		<div className="mt-3 text-2xl sm:text-3xl text-zinc-200 leading-snug text-center flex flex-wrap justify-center">
			{sentence.data.map((part, i) => {
				const { base, punct } = splitWordAndPunct(part.phrase)
				const isActive = i === activeIndex
				const partFormal =
					(part as { isFormal?: boolean }).isFormal === true ||
					(!anyPartHasFormal && sentenceLevelFormal)
				return (
					<React.Fragment key={i}>
						<span className="mx-1 inline-block">
							<span
								className={
									isActive
										? "underline underline-offset-4 decoration-2 decoration-emerald-400"
										: ""
								}
							>
								{base}
							</span>
							{isActive && partFormal && (
								<span className="block mt-1 text-[10px] tracking-wide uppercase rounded px-1 py-0.5 bg-sky-900/20 border border-sky-500/20 text-sky-300/80">
									Formal
								</span>
							)}
						</span>
						{punct && (
							<span className="inline-block align-baseline">{punct}</span>
						)}
						{i < sentence.data.length - 1 && <span className="inline"> </span>}
					</React.Fragment>
				)
			})}
		</div>
	)
}

export default OriginalSentenceLine
