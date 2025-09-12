"use client"
import React from "react"
import type { GeneratedQuiz } from "@/lib/quiz/types"
import type { SentenceDataEntry } from "@/data/types"
import SentenceLine from "@/components/SentenceLine"
import AnswerInput from "@/components/AnswerInput"
import { expectedAnswers } from "@/lib/translation"
import { normalizeText } from "@/lib/text"

// Simple client-side quiz runner expecting quiz JSON passed via sessionStorage
// (MVP: the builder will store the quiz under a key before navigating here)

const STORAGE_KEY = "customQuiz:active"

export default function QuizSessionPage() {
	const [quiz, setQuiz] = React.useState<GeneratedQuiz | null>(null)
	const [index, setIndex] = React.useState(0)
	const [translatedSet, setTranslatedSet] = React.useState<Set<number>>(
		new Set()
	)
	const [blankSet, setBlankSet] = React.useState<Set<number>>(new Set())
	const [showSummary, setShowSummary] = React.useState(false)
	const [coverage, setCoverage] = React.useState<Record<string, number>>({})

	React.useEffect(() => {
		const raw = window.sessionStorage.getItem(STORAGE_KEY)
		if (raw) {
			try {
				setQuiz(JSON.parse(raw))
			} catch {}
		}
	}, [])

	React.useEffect(() => {
		if (!quiz) return
		const q = quiz.questions[index]
		if (!q) return
		// Determine which indices have translations
		const blanks = new Set<number>()
		q.sentence.data.forEach((part: SentenceDataEntry, i) => {
			const maybe = (part as Record<string, unknown>).translation
			if (maybe !== undefined && maybe !== null) blanks.add(i)
		})
		setBlankSet(blanks)
		setTranslatedSet(new Set())
	}, [quiz, index])

	const current = quiz?.questions[index]
	const activeIndex = (() => {
		if (!current) return null
		for (const i of Array.from(blankSet.values())) {
			if (!translatedSet.has(i)) return i
		}
		return null
	})()

	const handleSubmit = (text: string) => {
		if (!current || activeIndex == null) return { correct: false }
		const entry = current.sentence.data[activeIndex]
		const answers = expectedAnswers(entry)
		if (answers.length === 0) return { correct: false }
		const isCorrect = answers.includes(normalizeText(text))
		if (!isCorrect) return { correct: false }
		setTranslatedSet((prev) => new Set(prev).add(activeIndex))
		const remaining = Array.from(blankSet.values()).filter(
			(i) => !translatedSet.has(i) && i !== activeIndex
		)
		if (remaining.length === 0) {
			// Sentence complete: advance or finish
			if (index + 1 < (quiz?.questions.length || 0)) {
				setTimeout(() => setIndex((i) => i + 1), 400)
			} else {
				// Quiz complete: compute coverage summary
				const cov: Record<string, number> = {}
				quiz?.questions.forEach((q) => {
					q.matchedTopics.forEach((t) => {
						cov[t] = (cov[t] || 0) + 1
					})
				})
				setCoverage(cov)
				setTimeout(() => setShowSummary(true), 300)
			}
		}
		return { correct: true }
	}

	if (!quiz) {
		return (
			<div className="min-h-screen flex items-center justify-center text-zinc-400 text-sm">
				No active quiz found. Return to dashboard to build one.
			</div>
		)
	}

	if (showSummary) {
		const total = quiz.questions.length
		const sorted = Object.entries(coverage).sort((a, b) => b[1] - a[1])
		return (
			<div className="min-h-screen px-4 pt-12 pb-16 flex flex-col items-center bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-zinc-100">
				<div className="w-full max-w-2xl space-y-6">
					<h1 className="text-xl font-semibold">Quiz Summary</h1>
					<p className="text-sm text-zinc-400">
						{total} sentences • Topic coverage below:
					</p>
					<ul className="space-y-1 text-sm">
						{sorted.map(([t, c]) => (
							<li
								key={t}
								className="flex justify-between border border-zinc-700/50 rounded px-2 py-1 bg-zinc-900/40"
							>
								<span className="truncate pr-4">{t}</span>
								<span className="font-mono text-emerald-300">{c}</span>
							</li>
						))}
					</ul>
					<div className="flex gap-3 pt-4">
						<button
							onClick={() => {
								window.location.href = "/dashboard"
							}}
							className="px-3 py-1.5 text-xs rounded bg-zinc-800 border border-zinc-600 hover:bg-zinc-700"
						>
							Dashboard
						</button>
						<button
							onClick={() => {
								sessionStorage.removeItem("customQuiz:active")
								window.location.href = "/dashboard"
							}}
							className="px-3 py-1.5 text-xs rounded bg-red-600/80 hover:bg-red-600 text-black font-medium"
						>
							Finish
						</button>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen px-4 pt-8 pb-16 flex flex-col items-center bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-zinc-100">
			<div className="w-full max-w-3xl space-y-6">
				<div className="flex justify-between items-center">
					<h1 className="text-xl font-semibold">Custom Quiz</h1>
					<div className="text-[10px] text-zinc-400 font-mono">
						{index + 1}/{quiz.questions.length}
					</div>
				</div>
				{current && (
					<div className="space-y-4">
						<SentenceLine
							sentence={current.sentence}
							toTranslate={blankSet}
							translated={translatedSet}
							activeIndex={activeIndex}
						/>
						<AnswerInput
							activeIndex={activeIndex}
							sentence={current.sentence}
							onSubmit={handleSubmit}
						/>
						<div className="flex flex-wrap gap-1">
							{current.matchedTopics.map((t) => (
								<span
									key={t}
									className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700"
								>
									{t}
								</span>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
