"use client"

import React from "react"
import { approxChWidth, splitWordAndPunct } from "@/lib/text"
import { spanishTarget } from "@/lib/translation"
import type { Sentence, SentenceDataEntry } from "@/data/types"

type Props = {
	sentence: Sentence | undefined
	toTranslate: Set<number>
	translated: Set<number>
	activeIndex: number | null
	minCh?: number
	maxCh?: number
}

const SentenceLine: React.FC<Props> = ({
	sentence,
	toTranslate,
	translated,
	activeIndex,
	minCh = 3,
	maxCh = 20,
}) => {
	if (!sentence) return null

	// Determine if sentence-level deprecated flag should apply to all parts
	const sentenceLevelNoPronoun = sentence.noPronoun
	const anyPartHasFlag = sentence.data.some(
		(p: SentenceDataEntry) =>
			(p as SentenceDataEntry & { noPronoun?: boolean }).noPronoun === true
	)

	return (
		<div className="mt-2 text-xl sm:text-2xl text-center flex flex-wrap justify-center text-zinc-100">
			{sentence.data.map((part, i) => {
				const shouldBeBlank = toTranslate.has(i)
				const isRevealed = translated.has(i)
				const { base, punct } = splitWordAndPunct(part.phrase)
				const isActive = i === activeIndex
				const partObj = part as SentenceDataEntry & { noPronoun?: boolean }
				const partNoPronoun =
					partObj.noPronoun === true ||
					(!anyPartHasFlag && sentenceLevelNoPronoun)
				const spanish = spanishTarget(
					part as unknown as import("@/data/types").SentenceDataEntry
				)
				const pt = (
					part as unknown as { phraseTranslation?: string | string[] }
				).phraseTranslation
				const phraseTrans =
					typeof pt === "string"
						? pt
						: Array.isArray(pt) && pt.length && typeof pt[0] === "string"
						? pt[0]
						: null

				const content =
					shouldBeBlank && !isRevealed ? (
						<span className="inline-flex flex-col items-center mx-1">
							<span
								className={
									"inline-block align-baseline border-b-2 h-[1.1em] leading-[1.1em] w-full select-none " +
									(isActive ? "border-blue-600" : "border-current")
								}
								style={{ width: `${approxChWidth(base, minCh, maxCh)}ch` }}
								aria-label="blank"
								aria-hidden="false"
							/>
							{partNoPronoun && (
								<span className="mt-0.5 text-[8px] tracking-wide uppercase rounded px-1 py-px bg-amber-900/30 border border-amber-500/30 text-amber-300/80 whitespace-nowrap">
									Pronoun ok omitted
								</span>
							)}
						</span>
					) : (
						<span className="inline-flex flex-col items-center mx-1">
							<span
								className={
									"inline-block align-baseline " +
									(isRevealed ? "text-emerald-300 font-medium" : "")
								}
							>
								{isRevealed ? phraseTrans ?? spanish ?? base : base}
							</span>
							{partNoPronoun && (
								<span className="mt-0.5 text-[8px] tracking-wide uppercase rounded px-1 py-px bg-amber-900/30 border border-amber-500/30 text-amber-300/80 whitespace-nowrap">
									Pronoun ok omitted
								</span>
							)}
						</span>
					)

				return (
					<React.Fragment key={i}>
						{content}
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

export default SentenceLine
