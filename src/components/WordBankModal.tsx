"use client"

import React from "react"
import { useDataStore } from "@/data/dataStore"
import type { Lesson } from "@/data/types"

type PrevWord = {
	id: string
	word: string
	pos?: string
	translations?: string[]
	info?: string[]
	lesson?: number | string
}

type Props = {
	open: boolean
	lesson?: Lesson
	onClose: () => void
}

const WordBankModal: React.FC<Props> = ({
	open,
	lesson: propLesson,
	onClose,
}) => {
	// Use store to access all lessons and current index; allow prop override
	const lessons = useDataStore((s) => s.lessons)
	const currentLessonIndex = useDataStore((s) => s.currentLessonIndex)
	const lesson = propLesson || lessons[currentLessonIndex]
	// Memoize the list to keep stable deps in callbacks
	const words = React.useMemo(() => lesson?.wordBank || [], [lesson?.wordBank])

	// Track which words are expanded; start with all collapsed
	const [openSet, setOpenSet] = React.useState<Set<string>>(new Set())
	const isOpen = React.useCallback((id: string) => openSet.has(id), [openSet])
	const toggle = React.useCallback((id: string) => {
		setOpenSet((prev) => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}, [])

	const collapseAll = React.useCallback(() => setOpenSet(new Set()), [])

	// Aggregate previous lessons' words grouped by POS (exclude current lesson)
	// Only include a small window of recent previous lessons to avoid showing the
	// entire global word list. Default window is the two lessons immediately
	// before the current lesson (configurable).
	const prevGroups = React.useMemo(() => {
		const obj: Record<string, PrevWord[]> = {}
		if (!lessons || lessons.length === 0) return obj
		const WINDOW_SIZE = 2 // show up to 2 previous lessons; change if desired
		const start = Math.max(0, (currentLessonIndex || 0) - WINDOW_SIZE)
		const end = Math.max(0, (currentLessonIndex || 0) - 1)
		for (let idx = start; idx <= end; idx++) {
			const L = lessons[idx]
			if (!L) continue
			const bank = L?.wordBank || []
			for (const w of bank) {
				// Defensive: some older lessons may have malformed entries or undefined words
				if (!w || typeof w !== "object") continue
				const key = (w.pos as string) || "Other"
				if (!obj[key]) obj[key] = []
				if (!obj[key].some((x) => x.id === w.id))
					obj[key].push({ ...w, lesson: L.lesson })
			}
		}
		return obj
	}, [lessons, currentLessonIndex])

	// Expand all should include current lesson words and previous-group words
	const expandAll = React.useCallback(() => {
		const ids = new Set<string>()
		for (const w of words) ids.add(String(w.id))
		for (const arr of Object.values(prevGroups)) {
			for (const w of arr) ids.add(String(w.id) + "::" + String(w.lesson))
		}
		setOpenSet(ids)
	}, [words, prevGroups])

	if (!open) return null

	return (
		<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
			{/* We DON'T add a global backdrop so it can stack with lesson intro. */}
			<div className="relative pointer-events-auto bg-white text-black dark:bg-zinc-900 dark:text-zinc-50 shadow-2xl rounded-t-lg sm:rounded-lg w-full sm:max-w-xl max-h-[70vh] flex flex-col border border-zinc-700/50 m-0 sm:m-4">
				<header className="px-5 pt-4 pb-3 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
					<h2 className="text-lg font-semibold tracking-tight">Word Bank</h2>
					<div className="flex items-center gap-2">
						{words.length > 0 && (
							<>
								<button
									className="px-2 py-1 text-[11px] rounded border border-zinc-400 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
									onClick={expandAll}
									title="Expand all"
								>
									Expand All
								</button>
								<button
									className="px-2 py-1 text-[11px] rounded border border-zinc-400 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
									onClick={collapseAll}
									title="Collapse all"
								>
									Collapse All
								</button>
							</>
						)}
						<button
							className="px-2 py-1 text-xs rounded border border-zinc-400 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
							onClick={onClose}
						>
							Close
						</button>
					</div>
				</header>

				<div className="px-5 pb-5 pt-4 overflow-y-auto text-sm space-y-4">
					{/* Current lesson top */}
					{words.length === 0 ? (
						<p className="italic text-zinc-500">
							No word bank for this lesson.
						</p>
					) : (
						<div>
							<p className="text-xs text-zinc-400 uppercase tracking-wide mb-2">
								Current Lesson
							</p>
							{words.map((w) => {
								const id = String(w.id)
								const open = isOpen(id)
								const panelId = `wb-${id}`
								return (
									<div
										key={id}
										className="border border-zinc-300 dark:border-zinc-700 rounded bg-zinc-50 dark:bg-zinc-800/50"
									>
										<button
											className="w-full flex items-center justify-between gap-3 px-3 py-2"
											onClick={() => toggle(id)}
											aria-expanded={open}
											aria-controls={panelId}
										>
											<span className="flex flex-col items-start text-left">
												<span className="flex flex-wrap items-baseline gap-2">
													<span className="font-medium text-base">
														{w.word}
													</span>
													{w.pos && (
														<span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 uppercase tracking-wide">
															{w.pos}
														</span>
													)}
												</span>
												{!open &&
													w.translations &&
													w.translations.length > 0 && (
														<span className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5 line-clamp-1">
															{w.translations.join(" · ")}
														</span>
													)}
											</span>
											<span className="ml-3 inline-flex items-center justify-center w-5 h-5 text-[10px] rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200">
												{open ? "–" : "+"}
											</span>
										</button>
										{open && (
											<div
												id={panelId}
												className="px-3 pb-3"
											>
												{w.translations && w.translations.length > 0 && (
													<div className="text-xs text-zinc-600 dark:text-zinc-300 mb-2">
														{w.translations.join(" · ")}
													</div>
												)}
												{w.info && w.info.length > 0 && (
													<ul className="list-disc ml-5 space-y-1">
														{w.info.slice(0, 8).map((line, i) => (
															<li key={i}>{line}</li>
														))}
													</ul>
												)}
											</div>
										)}
									</div>
								)
							})}
						</div>
					)}

					{/* Previous lessons grouped by POS */}
					{Object.keys(prevGroups).length > 0 && (
						<div className="space-y-4">
							<p className="text-xs text-zinc-400 uppercase tracking-wide">
								Previous Lessons
							</p>
							{Object.entries(prevGroups).map(([pos, arr]) => (
								<div key={pos}>
									<p className="text-[11px] font-medium text-zinc-200 mb-2">
										{pos}
									</p>
									<div className="space-y-2">
										{arr.map((w: PrevWord) => {
											const id = String(w.id) + "::" + String(w.lesson)
											const open = isOpen(id)
											return (
												<div
													key={id}
													className="border border-zinc-300 dark:border-zinc-700 rounded bg-zinc-50 dark:bg-zinc-800/50"
												>
													<button
														className="w-full flex items-center justify-between gap-3 px-3 py-2"
														onClick={() => toggle(id)}
														aria-expanded={open}
													>
														<span className="flex flex-col items-start text-left">
															<span className="font-medium text-base">
																{w.word}{" "}
																<span className="text-[10px] ml-2 text-zinc-500">
																	(L{w.lesson})
																</span>
															</span>
															{!open &&
																w.translations &&
																w.translations.length > 0 && (
																	<span className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5 line-clamp-1">
																		{w.translations.join(" · ")}
																	</span>
																)}
														</span>
														<span className="ml-3 inline-flex items-center justify-center w-5 h-5 text-[10px] rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200">
															{open ? "–" : "+"}
														</span>
													</button>
													{open && (
														<div className="px-3 pb-3">
															{w.translations && w.translations.length > 0 && (
																<div className="text-xs text-zinc-600 dark:text-zinc-300 mb-2">
																	{w.translations.join(" · ")}
																</div>
															)}
															{w.info && w.info.length > 0 && (
																<ul className="list-disc ml-5 space-y-1">
																	{w.info.slice(0, 8).map((line, i) => (
																		<li key={i}>{line}</li>
																	))}
																</ul>
															)}
														</div>
													)}
												</div>
											)
										})}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default WordBankModal
