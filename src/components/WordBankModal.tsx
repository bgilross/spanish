"use client"

import React from "react"
import type { Lesson } from "@/data/types"

type Props = {
	open: boolean
	lesson: Lesson
	onClose: () => void
}

const WordBankModal: React.FC<Props> = ({ open, lesson, onClose }) => {
	if (!open) return null

	const words = lesson.wordBank || []

	return (
		<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
			{/* We DON'T add a global backdrop so it can stack with lesson intro. */}
			<div className="relative pointer-events-auto bg-white text-black dark:bg-zinc-900 dark:text-zinc-50 shadow-2xl rounded-t-lg sm:rounded-lg w-full sm:max-w-xl max-h-[70vh] flex flex-col border border-zinc-700/50 m-0 sm:m-4">
				<header className="px-5 pt-4 pb-3 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
					<h2 className="text-lg font-semibold tracking-tight">Word Bank</h2>
					<button
						className="px-2 py-1 text-xs rounded border border-zinc-400 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
						onClick={onClose}
					>
						Close
					</button>
				</header>
				<div className="px-5 pb-5 pt-4 overflow-y-auto text-sm space-y-4">
					{words.length === 0 && (
						<p className="italic text-zinc-500">
							No word bank for this lesson.
						</p>
					)}
					{words.map((w) => (
						<div
							key={w.id}
							className="border border-zinc-300 dark:border-zinc-700 rounded p-3 bg-zinc-50 dark:bg-zinc-800/50"
						>
							<div className="flex flex-wrap items-baseline gap-2 mb-1">
								<span className="font-medium text-base">{w.word}</span>
								{w.pos && (
									<span className="text-xs px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 uppercase tracking-wide">
										{w.pos}
									</span>
								)}
							</div>
							{w.translations && w.translations.length > 0 && (
								<div className="text-xs text-zinc-600 dark:text-zinc-300 mb-1">
									{w.translations.join(" · ")}
								</div>
							)}
							{w.info && w.info.length > 0 && (
								<ul className="list-disc ml-5 space-y-1">
									{w.info.slice(0, 5).map((line, i) => (
										<li key={i}>{line}</li>
									))}
								</ul>
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

export default WordBankModal
