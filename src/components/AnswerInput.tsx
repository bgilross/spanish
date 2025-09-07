"use client"

import React from "react"
import { spanishWordCount } from "@/lib/translation"
import type { Sentence } from "@/data/types"

type Props = {
	activeIndex: number | null
	sentence: Sentence | undefined
	onSubmit: (text: string) => { correct: boolean }
}

const AnswerInput: React.FC<Props> = ({ activeIndex, sentence, onSubmit }) => {
	const [input, setInput] = React.useState("")
	const [flash, setFlash] = React.useState<"none" | "green" | "red">("none")
	const inputRef = React.useRef<HTMLInputElement>(null)

	// Focus when active section changes
	React.useEffect(() => {
		if (activeIndex == null) return
		const el = inputRef.current
		if (!el) return
		const t = window.setTimeout(() => {
			el.focus()
			if (el.value) el.select()
		}, 0)
		return () => window.clearTimeout(t)
	}, [activeIndex])

	// Flash feedback
	React.useEffect(() => {
		if (flash === "none") return
		const cls = flash === "green" ? "flash-green" : "flash-red"
		const el = inputRef.current
		if (!el) return
		el.classList.add(cls)
		const t = window.setTimeout(() => {
			el.classList.remove(cls)
			setFlash("none")
		}, 450)
		return () => {
			el.classList.remove(cls)
			window.clearTimeout(t)
		}
	}, [flash])

	const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
		if (e.key !== "Enter") return
		if (!sentence || activeIndex == null) return
		const { correct } = onSubmit(input)
		setInput("")
		setFlash(correct ? "green" : "red")
	}

	const info = (() => {
		if (activeIndex == null) return null
		const entry = sentence?.data[activeIndex]
		if (!entry) return null
		const spanishCount = spanishWordCount(entry)
		// Derive English (source phrase) word count from the phrase field itself
		// (Original untranslated phrase user sees)
		const phrase = (entry as { phrase?: string }).phrase || ""
		const englishCount = phrase.trim().split(/\s+/).filter(Boolean).length
		return { spanishCount, englishCount }
	})()

	return (
		<div className="flex items-start gap-3 flex-wrap">
			<input
				type="text"
				ref={inputRef}
				autoFocus
				className="px-2 py-1 border rounded min-w-[16ch] bg-zinc-950/40 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
				placeholder={
					activeIndex == null ? "All parts translated" : "Type answer"
				}
				value={input}
				onChange={(e) => setInput(e.target.value)}
				onKeyDown={handleKeyDown}
				disabled={activeIndex == null}
			/>
			{info && (
				<div className="text-[10px] leading-snug px-2 py-1 rounded border border-zinc-700 bg-zinc-800/60 max-w-[40ch]">
					<p className="text-zinc-300">
						{info.spanishCount} Spanish word{info.spanishCount === 1 ? "" : "s"}{" "}
						and {info.englishCount} English word
						{info.englishCount === 1 ? "" : "s"} expected
					</p>
				</div>
			)}
		</div>
	)
}

export default AnswerInput
