"use client"
import React from "react"
import type { GeneratedQuiz } from "@/lib/quiz/types"
import type { SentenceDataEntry } from "@/data/types"
import SentenceLine from "@/components/SentenceLine"
import OriginalSentenceLine from "@/components/OriginalSentenceLine"
import AnswerInput from "@/components/AnswerInput"
import { expectedAnswers } from "@/lib/translation"
import { normalizeText } from "@/lib/text"
import CustomQuizSummaryModal, {
	buildCustomQuizSummary,
	CustomQuizSummaryData,
} from "@/components/quiz/CustomQuizSummaryModal"
import { useSession } from "next-auth/react"

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
	const [showOriginal, setShowOriginal] = React.useState(true)
	interface QuizSubmissionEntry {
		id: string
		sentenceIndex: number
		sectionIndex: number
		sentence: GeneratedQuiz["questions"][number]["sentence"]
		section: SentenceDataEntry
		isCorrect: boolean
		userInput: string
	}
	const [submissions, setSubmissions] = React.useState<QuizSubmissionEntry[]>(
		[]
	)
	const [summaryData, setSummaryData] =
		React.useState<CustomQuizSummaryData | null>(null)
	const { data: session } = useSession()
	const [saveStatus, setSaveStatus] = React.useState<{
		state: "idle" | "saving" | "saved" | "error"
		message?: string
		id?: string
	}>({ state: "idle" })

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
		// Log every attempt
		setSubmissions((prev) => [
			...prev,
			{
				id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
				sentenceIndex: index,
				sectionIndex: activeIndex,
				sentence: current.sentence,
				section: entry,
				isCorrect,
				userInput: text,
			},
		])
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

	// (Removed early return to keep hook order stable)

	// Build summary data once when summary toggles on
	React.useEffect(() => {
		if (!showSummary || !quiz) return
		const data = buildCustomQuizSummary({
			submissions,
			quizTopics: quiz.config.topics || [],
			seed: quiz.config.seed,
			coverage,
		})
		setSummaryData(data)
	}, [showSummary, quiz, submissions, coverage])

	// Attempt persistence when summaryData ready (not conditional hook; effect decides internally)
	React.useEffect(() => {
		if (!summaryData) return
		if (saveStatus.state !== "idle") return
		const userId = (session?.user as { id?: string } | undefined)?.id
		if (!userId) return
		let cancelled = false
		;(async () => {
			try {
				setSaveStatus({ state: "saving" })
				const res = await fetch("/api/lessonAttempts", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						userId,
						lessonNumber: 0,
						summary: summaryData,
					}),
				})
				if (!res.ok) {
					let message = res.statusText
					try {
						const j = await res.json()
						message = j.error || message
					} catch {}
					throw new Error(message)
				}
				const json = await res.json()
				if (!cancelled) setSaveStatus({ state: "saved", id: json?.attempt?.id })
			} catch (e) {
				if (!cancelled)
					setSaveStatus({
						state: "error",
						message: e instanceof Error ? e.message : "Failed",
					})
			}
		})()
		return () => {
			cancelled = true
		}
	}, [summaryData, session, saveStatus])

	const handleMarkCorrect = (
		sentenceIndex: number,
		sectionIndex: number,
		attemptId: string
	) => {
		setSubmissions((prev) =>
			prev.map((s) => {
				if (
					s.sentenceIndex === sentenceIndex &&
					s.sectionIndex === sectionIndex &&
					s.id === attemptId
				) {
					return { ...s, isCorrect: true }
				}
				return s
			})
		)
		// Rebuild summary immediately
		if (summaryData) {
			const rebuilt = buildCustomQuizSummary({
				submissions: submissions.map((s) =>
					s.id === attemptId ? { ...s, isCorrect: true } : s
				),
				quizTopics: summaryData.topics,
				seed: summaryData.seed,
				coverage: summaryData.coverage,
			})
			setSummaryData(rebuilt)
		}
	}

	const retrySave = () => setSaveStatus({ state: "idle" })

	// Summary modal overlay rendering variable (avoid early returns before hooks)
	const summaryOverlay =
		showSummary && summaryData ? (
			<>
				<CustomQuizSummaryModal
					open={true}
					onClose={() => {
						sessionStorage.removeItem("customQuiz:active")
						window.location.href = "/dashboard"
					}}
					summary={summaryData}
					onMarkCorrect={handleMarkCorrect}
					saveStatus={saveStatus}
					onRetrySave={retrySave}
				/>
				<div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black" />
			</>
		) : null

	return (
		<div className="min-h-screen px-4 pt-8 pb-16 flex flex-col items-center bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-zinc-100">
			{summaryOverlay}
			{!quiz ? (
				<div className="flex-1 flex items-center justify-center w-full text-zinc-400 text-sm">
					No active quiz found. Return to dashboard to build one.
				</div>
			) : (
				<div className="w-full max-w-3xl space-y-6">
					<div className="flex justify-between items-center">
						<h1 className="text-xl font-semibold">Custom Quiz</h1>
						<div className="text-[10px] text-zinc-400 font-mono">
							{index + 1}/{quiz.questions.length}
						</div>
					</div>
					{current && (
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<button
									onClick={() => setShowOriginal((p) => !p)}
									className="text-[10px] px-2 py-1 rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
									type="button"
								>
									{showOriginal ? "Hide" : "Show"} Original
								</button>
								<div className="text-[10px] text-zinc-500">
									Seed: {quiz.config.seed || "—"}
								</div>
							</div>
							{showOriginal && (
								<OriginalSentenceLine
									sentence={current.sentence}
									activeIndex={activeIndex}
								/>
							)}
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
			)}
		</div>
	)
}
