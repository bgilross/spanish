"use client"

import React from "react"
import type { Lesson } from "@/data/types"

type Props = {
	open: boolean
	lesson: Lesson
	lessonIndex: number
	totalLessons: number
	onClose: () => void // Starts the quiz
	onNavigate: (index: number) => void // For prev/next while staying in modal
}

const LessonIntroModal: React.FC<Props> = ({
	open,
	lesson,
	lessonIndex,
	totalLessons,
	onClose,
	onNavigate,
}) => {
	if (!open) return null

	const hasPrev = lessonIndex > 0
	const hasNext = lessonIndex < totalLessons - 1

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			/>
			<div className="relative bg-white text-black dark:bg-zinc-900 dark:text-zinc-50 shadow-2xl rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col border border-zinc-700/50">
				<header className="px-5 pt-4 pb-3 border-b border-zinc-200 dark:border-zinc-700 flex flex-col gap-1">
					<div className="flex items-center justify-between gap-4">
						<h2 className="text-xl font-semibold tracking-tight">
							{lesson.name}
						</h2>
						<div className="flex items-center gap-2">
							<button
								className="px-3 py-1 text-sm rounded border border-zinc-400 dark:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800"
								onClick={() => hasPrev && onNavigate(lessonIndex - 1)}
								disabled={!hasPrev}
							>
								Prev
							</button>
							<button
								className="px-3 py-1 text-sm rounded border border-zinc-400 dark:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800"
								onClick={() => hasNext && onNavigate(lessonIndex + 1)}
								disabled={!hasNext}
							>
								Next
							</button>
							<button
								className="px-3 py-1 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-500"
								onClick={onClose}
							>
								Start Lesson
							</button>
						</div>
					</div>
					{lesson.details && (
						<p className="text-sm text-zinc-600 dark:text-zinc-300 leading-snug">
							{lesson.details}
						</p>
					)}
				</header>
				<div className="px-5 pb-5 pt-4 overflow-y-auto text-sm space-y-4">
					{lesson.info && lesson.info.length > 0 ? (
						lesson.info.map((line, i) => (
							<p
								key={i}
								className="leading-relaxed [&:not(:first-child)]:mt-2 whitespace-pre-line"
							>
								{line}
							</p>
						))
					) : (
						<p className="italic text-zinc-500">No lesson notes yet.</p>
					)}
				</div>
			</div>
		</div>
	)
}

export default LessonIntroModal
