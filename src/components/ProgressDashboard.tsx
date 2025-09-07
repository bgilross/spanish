"use client"
import React from "react"
import { useSession } from "next-auth/react"

interface SentenceStat {
	sentenceIndex: number
	totalSections?: number
	firstTryCorrectSections?: number[]
	incorrectSections?: number[]
}

interface AttemptSummary {
	errorCategoryCounts?: Record<string, number>
	incorrect?: unknown[]
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
							<p
								key={k}
								className="text-xs text-zinc-300 flex justify-between"
							>
								<span>{k}</span>
								<span className="text-zinc-400">{v}</span>
							</p>
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
				<div className="px-4 pb-4 pt-1 space-y-3 text-xs text-zinc-300">
					<div className="flex flex-wrap gap-3">
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
					{sentenceStats.length > 0 && (
						<div className="space-y-1">
							<p className="text-[11px] uppercase tracking-wide text-zinc-500">
								Sentences
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
				</div>
			)}
		</li>
	)
}
