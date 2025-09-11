"use client"

import React from "react"
import { approxChWidth, splitWordAndPunct } from "@/lib/text"
import { spanishTarget } from "@/lib/translation"
import type { Sentence } from "@/data/types"

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

	return (
		<div className="mt-2 text-xl sm:text-2xl text-center flex flex-wrap justify-center text-zinc-100">
			{sentence.data.map((part, i) => {
				const shouldBeBlank = toTranslate.has(i)
				const isRevealed = translated.has(i)
				const { base, punct } = splitWordAndPunct(part.phrase)
				const isActive = i === activeIndex
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
						<span
							className={
								"inline-block align-baseline border-b-2 h-[1.1em] leading-[1.1em] mx-1 select-none " +
								(isActive ? "border-blue-600" : "border-current")
							}
							style={{ width: `${approxChWidth(base, minCh, maxCh)}ch` }}
							aria-label="blank"
							aria-hidden="false"
						/>
					) : (
						<span
							className={
								"inline-block align-baseline mx-1 " +
								(isRevealed ? "text-emerald-300 font-medium" : "")
							}
						>
							{isRevealed ? phraseTrans ?? spanish ?? base : base}
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
