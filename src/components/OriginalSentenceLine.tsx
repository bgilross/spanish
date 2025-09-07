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

  return (
    <div className="text-base text-zinc-200 leading-relaxed mt-2 flex flex-wrap">
      {sentence.data.map((part, i) => {
        const { base, punct } = splitWordAndPunct(part.phrase)
        const isActive = i === activeIndex
        return (
          <React.Fragment key={i}>
            <span
              className={
                "mx-1 inline-block" +
                (isActive
                  ? " underline decoration-emerald-400 underline-offset-4 decoration-2"
                  : "")
              }
            >
              {base}
            </span>
            {punct && <span className="inline-block align-baseline">{punct}</span>}
            {i < sentence.data.length - 1 && <span className="inline"> </span>}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export default OriginalSentenceLine
