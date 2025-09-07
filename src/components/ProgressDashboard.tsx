"use client"
import React from "react"
import { useSession } from "next-auth/react"
import spanishData from "@/data/spanishData"
import { expectedAnswers } from "@/lib/translation"
import type { SubmissionLog, SentenceDataEntry, Sentence } from "@/data/types"

interface SentenceStat {
	sentenceIndex: number
	totalSections?: number
	firstTryCorrectSections?: number[]
	incorrectSections?: number[]
}

interface SummarySubmission extends SubmissionLog {
	expected?: string[]
	references?: string[]
}

interface AttemptSummary {
	errorCategoryCounts?: Record<string, number>
	incorrect?: SummarySubmission[]
	correct?: SummarySubmission[]
	sentenceStats?: SentenceStat[]
	[k: string]: unknown
}

type LessonAttempt = {
	id: string
	userId: string
	lessonNumber: number
	correctCount: number
	incorrectCount: number
	totalSubmissions: number
	references: string[]
	createdAt: string
	summary: AttemptSummary
}

export function ProgressDashboard() {
	const { data: session, status } = useSession()
	const userId = (session?.user as { id?: string } | undefined)?.id
	const [attempts, setAttempts] = React.useState<LessonAttempt[] | null>(null)
	const [loading, setLoading] = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)

	const load = React.useCallback(async () => {
		if (!userId) return
		setLoading(true)
		setError(null)
		try {
			const r = await fetch(
				`/api/lessonAttempts?userId=${encodeURIComponent(userId)}&limit=50`,
				{ cache: "no-store" }
			)
			if (!r.ok) throw new Error(await r.text().catch(() => r.statusText))
			const data = await r.json()
			setAttempts(data.attempts || [])
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Failed to load attempts")
		} finally {
			setLoading(false)
		}
	}, [userId])

	React.useEffect(() => {
		load()
	}, [load])

	const aggregate = React.useMemo(() => {
		if (!attempts || attempts.length === 0) return null
		const totalAttempts = attempts.length
		let totalCorrect = 0
		let totalAnswered = 0
		const lessonsSet = new Set<number>()
		const categoryTotals: Record<string, number> = {}
		for (const a of attempts) {
			lessonsSet.add(a.lessonNumber)
			totalCorrect += a.correctCount
			totalAnswered += a.correctCount + a.incorrectCount
			const cats = a.summary?.errorCategoryCounts || {}
			Object.entries(cats).forEach(([k, v]) => {
				const n = typeof v === "number" ? v : 0
				categoryTotals[k] = (categoryTotals[k] || 0) + n
			})
		}
		const avgAccuracy = totalAnswered ? (totalCorrect / totalAnswered) * 100 : 0
		const topCategories = Object.entries(categoryTotals)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
		return {
			totalAttempts,
			lessonsCompleted: lessonsSet.size,
			avgAccuracy,
			topCategories,
		}
	}, [attempts])

	// Build reference explanation map (reference key -> explanation strings)
	const referenceInfoMap = React.useMemo(() => {
		interface LessonLike {
			info: string[]
			sentences?: Sentence[]
		}
		const map: Record<string, string[]> = {}
		const lessons = (spanishData as { lessons?: LessonLike[] }).lessons || []
		for (const lesson of lessons) {
			const infoArr = Array.isArray(lesson.info) ? lesson.info : []
			for (const sentence of lesson.sentences || []) {
				for (const entry of sentence.data || []) {
					const refObj = (
						entry as { reference?: Record<string, (number | string)[]> }
					).reference
					if (!refObj) continue
					for (const [refKey, arr] of Object.entries(refObj)) {
						if (!map[refKey]) map[refKey] = []
						for (const val of arr) {
							if (typeof val === "number" && infoArr[val]) {
								if (!map[refKey].includes(infoArr[val]))
									map[refKey].push(infoArr[val])
							} else if (typeof val === "string") {
								if (!map[refKey].includes(val)) map[refKey].push(val)
							}
						}
					}
				}
			}
		}
		return map
	}, [])

	if (status === "loading") {
		return <div className="text-sm text-zinc-400">Loading session…</div>
	}
	if (!userId) {
		return (
			<div className="text-sm text-zinc-400">
				Sign in to view your progress.
			</div>
		)
	}

	return (
		<div className="space-y-8">
			<div className="flex items-center gap-3">
				<button
					onClick={load}
					className="px-3 py-1.5 text-xs rounded border border-zinc-600 hover:bg-zinc-800"
					disabled={loading}
				>
					{loading ? "Refreshing…" : "Refresh"}
				</button>
				{error && <span className="text-xs text-rose-400">{error}</span>}
			</div>

			{aggregate && (
				<div className="grid gap-4 sm:grid-cols-4 text-sm">
					<div className="rounded-md border border-zinc-700 bg-zinc-800/50 p-3">
						<p className="text-zinc-400">Attempts</p>
						<p className="text-lg font-semibold text-zinc-100">
							{aggregate.totalAttempts}
						</p>
					</div>
					<div className="rounded-md border border-zinc-700 bg-zinc-800/50 p-3">
						<p className="text-zinc-400">Lessons Completed</p>
						<p className="text-lg font-semibold text-zinc-100">
							{aggregate.lessonsCompleted}
						</p>
					</div>
					<div className="rounded-md border border-zinc-700 bg-zinc-800/50 p-3">
						<p className="text-zinc-400">Avg Accuracy</p>
						<p className="text-lg font-semibold text-emerald-400">
							{aggregate.avgAccuracy.toFixed(1)}%
						</p>
					</div>
					<div className="rounded-md border border-zinc-700 bg-zinc-800/50 p-3">
						<p className="text-zinc-400 mb-1">Top Errors</p>
						{aggregate.topCategories.length === 0 && (
							<p className="text-xs text-zinc-500">None</p>
						)}
						{aggregate.topCategories.map(([k, v]) => (
							<ErrorCategoryRow
								key={k}
								k={k}
								v={v}
								explanations={referenceInfoMap[k]}
							/>
						))}
					</div>
				</div>
			)}

			<div>
				<h2 className="text-sm font-medium text-zinc-300 mb-2">
					Recent Attempts
				</h2>
				{!attempts && !error && (
					<p className="text-xs text-zinc-500">Loading attempts…</p>
				)}
				{attempts && attempts.length === 0 && (
					<p className="text-xs text-zinc-500">No attempts yet.</p>
				)}
				<ul className="space-y-2">
					{attempts?.map((a) => {
						const accuracy =
							a.correctCount + a.incorrectCount > 0
								? (a.correctCount / (a.correctCount + a.incorrectCount)) * 100
								: 0
						return (
							<AttemptRow
								key={a.id}
								attempt={a}
								accuracy={accuracy}
							/>
						)
					})}
				</ul>
			</div>
		</div>
	)
}

function AttemptRow({
	attempt,
	accuracy,
}: {
	attempt: LessonAttempt
	accuracy: number
}) {
	const [open, setOpen] = React.useState(false)
	const created = new Date(attempt.createdAt)
	const cats = attempt.summary?.errorCategoryCounts || {}
	const incorrect = attempt.summary?.incorrect?.length || attempt.incorrectCount
	const sentenceStats = attempt.summary?.sentenceStats || []

	// Build per-sentence detailed attempts: user inputs vs expected answers.
	const sentenceDetails = React.useMemo(() => {
		const map = new Map<
			number,
			{
				sentence?: Sentence
				sections: Record<
					number,
					{ phrase: string; attempts: string[]; expected: string[] }
				>
			}
		>()
		const incorrectSubs = attempt.summary.incorrect || []
		const correctSubs = attempt.summary.correct || []
		const process = (subs: SummarySubmission[]) => {
			for (const s of subs) {
				if (
					typeof s.sentenceIndex !== "number" ||
					typeof s.sectionIndex !== "number"
				)
					continue
				if (!map.has(s.sentenceIndex)) {
					map.set(s.sentenceIndex, {
						sentence: s.sentence as Sentence,
						sections: {},
					})
				}
				const sent = map.get(s.sentenceIndex)!
				const secIdx = s.sectionIndex
				const sections = sent.sections
				if (!sections[secIdx]) {
					const entry = s.section as SentenceDataEntry
					const expected =
						s.expected && s.expected.length
							? s.expected
							: expectedAnswers(entry)
					const phrase =
						(entry as { phrase?: string }).phrase || "Section " + (secIdx + 1)
					sections[secIdx] = { phrase, attempts: [], expected }
				}
				// Append user input if new
				if (typeof s.userInput === "string" && s.userInput.trim()) {
					const arr = sections[secIdx].attempts
					if (arr[arr.length - 1] !== s.userInput) arr.push(s.userInput)
				}
			}
		}
		process(incorrectSubs)
		process(correctSubs)
		// Return ordered array
		return Array.from(map.entries())
			.sort((a, b) => a[0] - b[0])
			.map(([idx, val]) => ({ sentenceIndex: idx, ...val }))
	}, [attempt.summary])

	return (
		<li className="border border-zinc-700 rounded-md bg-zinc-800/40">
			<button
				onClick={() => setOpen((o) => !o)}
				className="w-full text-left px-3 py-2 flex items-center justify-between gap-4 hover:bg-zinc-800/60"
			>
				<span className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
					<span className="text-xs font-medium text-zinc-200">
						Lesson {attempt.lessonNumber}
					</span>
					<span className="text-xs text-zinc-400">
						{created.toLocaleString()}
					</span>
				</span>
				<span className="flex items-center gap-4">
					<span className="text-xs text-emerald-400 font-semibold">
						{accuracy.toFixed(1)}%
					</span>
					<span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-200">
						{attempt.correctCount}/{attempt.correctCount + incorrect}
					</span>
					<span className="text-[10px] px-1 py-0.5 rounded bg-zinc-700 text-zinc-300">
						{open ? "Hide" : "Show"}
					</span>
				</span>
			</button>
			{open && (
				<div className="px-4 pb-4 pt-1 space-y-5 text-xs text-zinc-300">
					{/* Error Categories */}
					<div className="space-y-2">
						<p className="text-[11px] uppercase tracking-wide text-zinc-500">
							Error Categories
						</p>
						<div className="flex flex-wrap gap-2">
							{Object.keys(cats).length === 0 && (
								<span className="text-zinc-500">No errors</span>
							)}
							{Object.entries(cats).map(([k, v]) => (
								<span
									key={k}
									className="inline-flex items-center gap-1 rounded border border-zinc-600 px-2 py-0.5 bg-zinc-800/60"
								>
									<span>{k}</span>
									<span className="text-zinc-400">{v as number}</span>
								</span>
							))}
						</div>
					</div>

					{/* Sentence Stats */}
					{sentenceStats.length > 0 && (
						<div className="space-y-2">
							<p className="text-[11px] uppercase tracking-wide text-zinc-500">
								Sentence Performance
							</p>
							<div className="grid gap-2 sm:grid-cols-2">
								{sentenceStats.map((s: SentenceStat) => {
									const secTotal = s.totalSections || 0
									const firstTry = (s.firstTryCorrectSections || []).length
									const struggle = (s.incorrectSections || []).length
									return (
										<div
											key={s.sentenceIndex}
											className="border border-zinc-700 rounded p-2 bg-zinc-800/40"
										>
											<p className="text-[11px] text-zinc-400 mb-1">
												Sentence {s.sentenceIndex + 1}
											</p>
											<p className="text-[10px] text-zinc-300">
												Sections: {secTotal}
											</p>
											<p className="text-[10px] text-emerald-400">
												First-Try: {firstTry}
											</p>
											<p className="text-[10px] text-rose-400">
												Struggle: {struggle}
											</p>
										</div>
									)
								})}
							</div>
						</div>
					)}

					{/* Sentence Details */}
					{sentenceDetails.length > 0 && (
						<div className="space-y-2">
							<p className="text-[11px] uppercase tracking-wide text-zinc-500">
								Sentence Details
							</p>
							<div className="space-y-3">
								{sentenceDetails.map((sd) => (
									<div
										key={sd.sentenceIndex}
										className="border border-zinc-700 rounded p-2 bg-zinc-900/50 space-y-2"
									>
										<p className="text-[11px] font-medium text-zinc-200">
											Sentence {sd.sentenceIndex + 1}:{" "}
											<span className="text-zinc-400">
												{sd.sentence?.sentence}
											</span>
										</p>
										<div className="space-y-1">
											{Object.entries(sd.sections)
												.sort((a, b) => Number(a[0]) - Number(b[0]))
												.map(([secIdx, sec]) => (
													<div
														key={secIdx}
														className="text-[11px] border border-zinc-700 rounded px-2 py-1 bg-zinc-800/40"
													>
														<p className="text-zinc-300">
															<span className="text-zinc-500">
																Section {Number(secIdx) + 1}:
															</span>{" "}
															{sec.phrase}
														</p>
														<p className="text-[10px] mt-0.5">
															<span className="text-zinc-500">
																Your Attempts:
															</span>{" "}
															{sec.attempts.map((a, i) => (
																<span
																	key={i}
																	className={
																		"px-1 rounded " +
																		(i === sec.attempts.length - 1
																			? "bg-emerald-700/40 text-emerald-300"
																			: "bg-zinc-700/40 text-zinc-300")
																	}
																>
																	{a}
																</span>
															))}
														</p>
														<p className="text-[10px] mt-0.5">
															<span className="text-zinc-500">Correct:</span>{" "}
															{sec.expected.map((e, i) => (
																<span
																	key={i}
																	className="px-1 rounded bg-emerald-800/40 text-emerald-300 mr-1"
																>
																	{e}
																</span>
															))}
														</p>
													</div>
												))}
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			)}
		</li>
	)
}

function ErrorCategoryRow({
	k,
	v,
	explanations,
}: {
	k: string
	v: number
	explanations?: string[]
}) {
	const [open, setOpen] = React.useState(false)
	return (
		<div className="mb-1">
			<button
				onClick={() => setOpen((o) => !o)}
				className="text-xs w-full text-left flex justify-between items-center gap-2 hover:text-zinc-200"
			>
				<span>{k}</span>
				<span className="text-zinc-400 flex items-center gap-2">
					{v}
					<span className="text-[10px] px-1 py-0.5 rounded bg-zinc-700">
						{open ? "-" : "+"}
					</span>
				</span>
			</button>
			{open && (
				<div className="mt-1 space-y-1 pl-2 border-l border-zinc-700">
					{explanations && explanations.length > 0 ? (
						explanations.map((e, i) => (
							<p
								key={i}
								className="text-[10px] text-zinc-400 leading-snug"
							>
								{e}
							</p>
						))
					) : (
						<p className="text-[10px] text-zinc-600">
							No reference details found.
						</p>
					)}
				</div>
			)}
		</div>
	)
}
