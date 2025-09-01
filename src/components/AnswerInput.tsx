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

	const placeholder = (() => {
		if (activeIndex == null) return "All parts translated"
		const entry = sentence?.data[activeIndex]
		if (!entry) return "Translate"
		const count = spanishWordCount(entry)
		return count === 1
			? "Expect 1 Spanish word"
			: `Expect ${count} Spanish words`
	})()

	return (
		<input
			type="text"
			ref={inputRef}
			autoFocus
			className="px-2 py-1 border rounded min-w-[16ch]"
			placeholder={placeholder}
			value={input}
			onChange={(e) => setInput(e.target.value)}
			onKeyDown={handleKeyDown}
			disabled={activeIndex == null}
		/>
	)
}

export default AnswerInput
