"use client"

import React from "react"
import { spanishWordCount } from "@/lib/translation"
import type { Sentence, SentenceDataEntry } from "@/data/types"

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
		// Don't focus when a modal overlay is open on mobile (keyboard would stay open)
		if ((modalOpenRef.current as boolean) === true) return
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
		// Accent shortcut: Alt+<letter> inserts an accented Spanish character
		// Use Alt only (avoid Meta/Ctrl). Note: Alt shortcuts can conflict with some OS/menu
		if (e.altKey && !e.ctrlKey && !e.metaKey) {
			const key = String(e.key || "").toLowerCase()
			const ACCENTS: Record<string, [string, string]> = {
				a: ["á", "Á"],
				e: ["é", "É"],
				i: ["í", "Í"],
				o: ["ó", "Ó"],
				u: ["ú", "Ú"],
				n: ["ñ", "Ñ"],
			}
			if (key in ACCENTS) {
				e.preventDefault()
				const ch = e.shiftKey ? ACCENTS[key][1] : ACCENTS[key][0]
				const el = inputRef.current
				if (!el) return
				const start = el.selectionStart ?? input.length
				const end = el.selectionEnd ?? input.length
				const before = input.slice(0, start)
				const after = input.slice(end)
				const next = before + ch + after
				setInput(next)
				// update caret position after React updates
				window.setTimeout(() => {
					if (!inputRef.current) return
					const pos = (start || 0) + ch.length
					inputRef.current.setSelectionRange(pos, pos)
					inputRef.current.focus()
				}, 0)
				return
			}
		}

		if (e.key !== "Enter") return
		if (!sentence || activeIndex == null) return
		const { correct } = onSubmit(input)
		setInput("")
		setFlash(correct ? "green" : "red")
	}

	// Track whether a modal overlay is open so we avoid focusing the input
	const modalOpenRef = React.useRef<boolean>(false)
	React.useEffect(() => {
		const onOpen = () => {
			modalOpenRef.current = true
			if (inputRef.current) inputRef.current.blur()
		}
		const onClose = () => {
			modalOpenRef.current = false
			// If there's an active section, restore focus when the modal closes
			if (activeIndex != null) {
				window.setTimeout(() => {
					if (inputRef.current) {
						inputRef.current.focus()
						if (inputRef.current.value) inputRef.current.select()
					}
				}, 0)
			}
		}
		window.addEventListener("app:modal-open", onOpen)
		window.addEventListener("app:modal-close", onClose)
		return () => {
			window.removeEventListener("app:modal-open", onOpen)
			window.removeEventListener("app:modal-close", onClose)
		}
	}, [activeIndex])

	const info = (() => {
		if (activeIndex == null) return null
		const entry = sentence?.data[activeIndex]
		if (!entry) return null
		const spanishCount = spanishWordCount(entry)
		// Prefer phraseTranslation for English-side count when available,
		// then subtract the Spanish word count to avoid double-counting mixed phrases.
		const pt = (entry as { phraseTranslation?: string | string[] })
			.phraseTranslation
		let englishCount: number
		if (typeof pt === "string") {
			const total = pt.trim().split(/\s+/).filter(Boolean).length
			englishCount = Math.max(0, total - spanishCount)
		} else if (Array.isArray(pt) && pt.length && typeof pt[0] === "string") {
			const total = pt[0].trim().split(/\s+/).filter(Boolean).length
			englishCount = Math.max(0, total - spanishCount)
		} else {
			// No phraseTranslation: the user should type only Spanish for this section
			englishCount = 0
		}
		// Determine pronoun optional flag (per-part overrides sentence-level)
		const partFlag = (entry as SentenceDataEntry & { noPronoun?: boolean })
			.noPronoun
		const sentenceLevel = sentence?.noPronoun
		const noPronoun = partFlag === true || (sentenceLevel && partFlag !== false)
		return { spanishCount, englishCount, noPronoun }
	})()

	return (
		<div className="flex items-start justify-center gap-3 flex-wrap w-full">
			<input
				type="text"
				ref={inputRef}
				// autoFocus removed: focus is now managed programmatically and will
				// avoid focusing when modal overlays are open (prevents keyboard staying open on mobile)
				className="px-3 py-2 border rounded min-w-[24ch] text-lg sm:text-xl bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
				placeholder={
					activeIndex == null ? "All parts translated" : "Type answer"
				}
				value={input}
				onChange={(e) => setInput(e.target.value)}
				onKeyDown={handleKeyDown}
				disabled={activeIndex == null}
			/>
			{/* Small hint for accent shortcuts */}
			<div className="text-[10px] text-zinc-400 mt-1 w-full text-center">
				Press Alt+e/i/o/u/a/n to insert accents (e.g. Alt+e → é). Use Shift+Alt
				for uppercase.
			</div>
			{info && (
				<div className="text-[10px] leading-snug px-2 py-1 rounded border border-zinc-700 bg-zinc-800/60 max-w-[40ch]">
					<p className="text-zinc-300">
						{info.spanishCount} Spanish word{info.spanishCount === 1 ? "" : "s"}{" "}
						and {info.englishCount} English word
						{info.englishCount === 1 ? "" : "s"} expected
					</p>
					{info.noPronoun && activeIndex != null && (
						<p className="mt-1 text-amber-300/80">No subject pronoun</p>
					)}
				</div>
			)}
		</div>
	)
}

export default AnswerInput
