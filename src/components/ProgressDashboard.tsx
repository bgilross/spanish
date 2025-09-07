"use client"
import React from "react"
import { useSession } from "next-auth/react"
import spanishWords from "@/data/spanishWords"

// Reusable formatting for error/reference category keys
const POS_LABELS: Record<string, string> = {
	prep: "Preposition",
	verb: "Verb",
	noun: "Noun",
	adj: "Adjective",
	adv: "Adverb",
	advrb: "Adverb",
	article: "Article",
	artcl: "Article",
	pron: "Pronoun",
	det: "Determiner",
	conj: "Conjunction",
	interj: "Interjection",
	num: "Number",
}

export function formatErrorCategory(key: string): string {
	const parts = key.split(".")
	if (parts.length === 3 && parts[1] === "words") {
		const [groupId, , wordId] = parts
		const groupLabel =
			POS_LABELS[groupId] ||
			groupId
				.replace(/[_-]+/g, " ")
				.replace(/(^|\s)\w/g, (c) => c.toUpperCase())
		// Attempt to pull the actual word (with accents) from spanishWords data
		try {
			interface MinimalWord {
				word?: string
			}
			interface MinimalGroup {
				words?: Record<string, MinimalWord>
			}
			const groupsUnknown: unknown = spanishWords
			if (
				groupsUnknown &&
				typeof groupsUnknown === "object" &&
				groupId in (groupsUnknown as Record<string, unknown>)
			) {
				const group = (groupsUnknown as Record<string, MinimalGroup>)[groupId]
				const surface = group?.words?.[wordId]?.word || wordId
				return `${surface} (${groupLabel})`
			}
		} catch {
			// silent fallback
		}
		return `${wordId} (${groupLabel})`
	}
	return key
}
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

function AllErrorsBlock({
	aggregate,
	referenceInfoMap,
}: {
	aggregate: {
		allCategories: [string, number][]
		topCategories: [string, number][]
	}
	referenceInfoMap: Record<string, string[]>
}) {
	const [showAll, setShowAll] = React.useState(false)
	const list = showAll ? aggregate.allCategories : aggregate.topCategories
	return (
		<div className="rounded-md border border-zinc-700 bg-zinc-800/50 p-3">
			<div className="flex items-start justify-between mb-1">
				<p className="text-zinc-400 text-sm leading-tight">
					{showAll ? "All Errors" : "Top Errors"}
				</p>
				{aggregate.allCategories.length > 5 && (
					<button
						onClick={() => setShowAll((s) => !s)}
						className="text-[10px] px-2 py-0.5 rounded border border-zinc-600 hover:bg-zinc-700 text-zinc-200"
					>
						{showAll
							? "Show Top"
							: `Show All (${aggregate.allCategories.length})`}
					</button>
				)}
			</div>
			{list.length === 0 && <p className="text-xs text-zinc-500">None</p>}
			<div className="space-y-1 max-h-60 overflow-auto pr-1">
				{list.map(([k, v]) => (
					<ErrorCategoryRow
						key={k}
						k={k}
						v={v}
						explanations={referenceInfoMap[k]}
					/>
				))}
			</div>
		</div>
	)
}

export function ProgressDashboard() {
	const { data: session, status } = useSession()
	let userId = (session?.user as { id?: string } | undefined)?.id
	// Dev fallback user (same logic as MainPage) so dashboard works without OAuth locally
	if (!userId && process.env.NODE_ENV === "development") {
		const fake =
			process.env.NEXT_PUBLIC_DEV_FAKE_USER_ID || process.env.DEV_FAKE_USER_ID
		if (fake) userId = fake
	}
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
		const allCategories = Object.entries(categoryTotals).sort(
			(a, b) => b[1] - a[1]
		)
		const topCategories = allCategories.slice(0, 5)
		return {
			totalAttempts,
			lessonsCompleted: lessonsSet.size,
			avgAccuracy,
			topCategories,
			allCategories,
		}
	}, [attempts])

	// Build reference explanation map from spanishWords only (group info + word info)
	const referenceInfoMap = React.useMemo(() => {
		const map: Record<string, string[]> = {}
		const groups = spanishWords as unknown as Record<
			string,
			{
				id: string
				info?: string[]
				words?: Record<string, { id: string; info?: string[] }>
			}
		>
		for (const maybeGroup of Object.values(groups)) {
			if (
				!maybeGroup ||
				typeof maybeGroup !== "object" ||
				!("id" in maybeGroup)
			)
				continue
			const group = maybeGroup as {
				id: string
				info?: string[]
				words?: Record<string, { id: string; info?: string[] }>
			}
			const gInfo = Array.isArray(group.info) ? group.info : []
			const wordEntries = group.words || {}
			for (const [key, w] of Object.entries(wordEntries)) {
				const refKey = `${group.id}.words.${key}`
				const wInfo = Array.isArray(w.info) ? w.info : []
				const combined: string[] = []
				for (const item of gInfo)
					if (!combined.includes(item)) combined.push(item)
				for (const item of wInfo)
					if (!combined.includes(item)) combined.push(item)
				map[refKey] = combined
			}
		}
		return map
	}, [])

	if (status === "loading") {
		return <div className="text-sm text-zinc-400">Loading session…</div>
	}
	const usingFallback =
		!session?.user && !!userId && process.env.NODE_ENV === "development"

	if (!userId) {
		return (
			<div className="text-sm text-zinc-400">
				Sign in to view your progress.
			</div>
		)
	}

	return (
		<div className="space-y-8">
			{usingFallback && (
				<div className="text-[10px] rounded border border-indigo-500/40 bg-indigo-500/5 text-indigo-300 px-2 py-1 inline-block">
					Using local dev fallback user:{" "}
					<span className="font-mono">{userId}</span>
				</div>
			)}
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
				<div className="grid gap-3 grid-cols-2 sm:grid-cols-4 text-sm">
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
					<AllErrorsBlock
						aggregate={aggregate}
						referenceInfoMap={referenceInfoMap}
					/>
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
					{attempts?.map((a, idx) => {
						const accuracy =
							a.correctCount + a.incorrectCount > 0
								? (a.correctCount / (a.correctCount + a.incorrectCount)) * 100
								: 0
						return (
							<AttemptRow
								key={a.id}
								attempt={a}
								accuracy={accuracy}
								attemptIndex={idx + 1}
								referenceInfoMap={referenceInfoMap}
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
	referenceInfoMap,
	attemptIndex,
}: {
	attempt: LessonAttempt
	accuracy: number
	referenceInfoMap: Record<string, string[]>
	attemptIndex: number
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
					{
						phrase: string
						attempts: { text: string; correct: boolean }[]
						expected: string[]
						references: string[]
						referenceDetails?: { key: string; indices: (number | string)[] }[]
					}
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
					const refs = (entry as { reference?: Record<string, unknown> })
						.reference
						? Object.keys(
								(entry as { reference?: Record<string, unknown> }).reference!
						  )
						: []
					const refObj =
						(entry as { reference?: Record<string, (number | string)[]> })
							.reference || {}
					const referenceDetails = Object.entries(refObj).map(
						([key, indices]) => ({ key, indices })
					)
					sections[secIdx] = {
						phrase,
						attempts: [],
						expected,
						references: refs,
						referenceDetails,
					}
				}
				// Append user input if new (track correctness)
				if (typeof s.userInput === "string" && s.userInput.trim()) {
					const arr = sections[secIdx].attempts
					const last = arr[arr.length - 1]
					if (!last || last.text !== s.userInput) {
						arr.push({ text: s.userInput, correct: !!s.isCorrect })
					}
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

	// Aggregate references across all sections for this attempt
	const aggregatedReferences = React.useMemo(() => {
		const acc: Record<string, Set<number | string>> = {}
		for (const sd of sentenceDetails) {
			for (const sec of Object.values(sd.sections)) {
				for (const rd of sec.referenceDetails || []) {
					if (!acc[rd.key]) acc[rd.key] = new Set()
					rd.indices.forEach((i) => acc[rd.key].add(i))
				}
			}
		}
		return Object.entries(acc).map(([key, set]) => ({
			key,
			indices: Array.from(set.values()),
		}))
	}, [sentenceDetails])

	const getRefLines = React.useCallback(
		(key: string, indices: (number | string)[]) => {
			const parts = key.split(".")
			if (parts.length !== 3 || parts[1] !== "words") return []
			const [groupId, , wordId] = parts
			const groupsUnknown: unknown = spanishWords
			if (
				!groupsUnknown ||
				typeof groupsUnknown !== "object" ||
				!(groupId in (groupsUnknown as Record<string, unknown>))
			) {
				return []
			}
			interface MinimalWord {
				info?: string[]
			}
			interface MinimalGroup {
				words?: Record<string, MinimalWord>
			}
			const group = (groupsUnknown as Record<string, MinimalGroup>)[groupId]
			if (!group || typeof group !== "object" || !group.words) return []
			const word = group.words[wordId]
			if (!word || !Array.isArray(word.info)) return []
			const lines: string[] = []
			indices.forEach((raw) => {
				const idx = typeof raw === "number" ? raw : parseInt(String(raw), 10)
				if (!isNaN(idx) && word.info && word.info[idx])
					lines.push(word.info[idx])
			})
			if (lines.length === 0 && word.info.length) {
				lines.push(word.info[0])
				if (word.info[1]) lines.push(word.info[1])
			}
			return lines
		},
		[]
	)

	return (
		<li className="border border-zinc-700 rounded-md bg-zinc-800/40">
			<button
				onClick={() => setOpen((o) => !o)}
				className="w-full text-left px-3 py-2 flex items-start sm:items-center justify-between gap-3 sm:gap-4 hover:bg-zinc-800/60"
			>
				<span className="flex flex-col gap-1 min-w-0">
					<span className="flex items-center gap-2">
						<span className="inline-flex shrink-0 items-center justify-center w-5 h-5 text-[10px] font-semibold rounded-full bg-zinc-700 text-zinc-200 border border-zinc-500">
							{attemptIndex}
						</span>
						<span className="text-xs font-medium text-zinc-200 truncate">
							Lesson {attempt.lessonNumber}
						</span>
					</span>
					<span className="flex items-center gap-2 text-[10px] text-zinc-500">
						<span className="sm:hidden">{created.toLocaleDateString()}</span>
						<span className="hidden sm:inline">{created.toLocaleString()}</span>
					</span>
				</span>
				<span className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-4 text-right">
					<span className="text-xs text-emerald-400 font-semibold leading-none">
						{accuracy.toFixed(1)}%
					</span>
					<span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-200 leading-none">
						{attempt.correctCount}/{attempt.correctCount + incorrect}
					</span>
					<span className="text-[10px] px-1 py-0.5 rounded bg-zinc-700 text-zinc-300 leading-none">
						{open ? "Hide" : "Show"}
					</span>
				</span>
			</button>
			{open && (
				<div className="px-3 sm:px-4 pb-4 pt-1 space-y-5 text-[11px] sm:text-xs text-zinc-300">
					{/* Error Categories */}
					<div className="space-y-2">
						<p className="text-[11px] uppercase tracking-wide text-zinc-500">
							Error Categories
						</p>
						<div className="space-y-1 max-h-56 overflow-auto pr-1">
							{Object.keys(cats).length === 0 && (
								<span className="text-zinc-500 text-xs">No errors</span>
							)}
							{Object.entries(cats).map(([k, v]) => (
								<ErrorCategoryRow
									key={k}
									k={k}
									v={v as number}
									explanations={referenceInfoMap[k]}
								/>
							))}
						</div>
					</div>

					{aggregatedReferences.length > 0 && (
						<div className="space-y-2">
							<p className="text-[11px] uppercase tracking-wide text-zinc-500">
								Referenced Concepts
							</p>
							<div className="space-y-2">
								{aggregatedReferences.map((ref) => {
									const lines = getRefLines(ref.key, ref.indices)
									return (
										<div
											key={ref.key}
											className="border border-zinc-700 rounded p-2 bg-zinc-900/40"
										>
											<p className="text-[11px] font-medium text-zinc-200 mb-1">
												{formatErrorCategory(ref.key)}
											</p>
											{lines.map((l, i) => (
												<p
													key={i}
													className="text-[10px] text-zinc-400 leading-snug"
												>
													{l}
												</p>
											))}
										</div>
									)
								})}
							</div>
						</div>
					)}

					{sentenceDetails.length > 0 && (
						<div className="space-y-2">
							<p className="text-[11px] uppercase tracking-wide text-zinc-500">
								Sentence Performance & Details
							</p>
							<div className="space-y-3">
								{sentenceDetails.map((sd) => {
									const stat = sentenceStats.find(
										(s) => s.sentenceIndex === sd.sentenceIndex
									)
									const secTotal = stat?.totalSections || 0
									const firstTry = (stat?.firstTryCorrectSections || []).length
									const struggle = (stat?.incorrectSections || []).length
									return (
										<div
											key={sd.sentenceIndex}
											className="border border-zinc-700 rounded p-2 bg-zinc-900/50 space-y-2"
										>
											<p className="text-[11px] font-medium text-zinc-200 break-words">
												Sentence {sd.sentenceIndex + 1}:{" "}
												<span className="text-zinc-400">
													{sd.sentence?.sentence}
												</span>
											</p>
											<div className="flex flex-wrap gap-3 text-[10px]">
												<span className="text-zinc-400">
													Sections:{" "}
													<span className="text-zinc-200">{secTotal}</span>
												</span>
												<span className="text-emerald-400">
													First-Try: {firstTry}
												</span>
												<span className="text-rose-400">
													Struggle: {struggle}
												</span>
											</div>
											<div className="space-y-1">
												{Object.entries(sd.sections)
													.sort((a, b) => Number(a[0]) - Number(b[0]))
													.map(([secIdx, sec]) => (
														<div
															key={secIdx}
															className="text-[11px] border border-zinc-700 rounded px-2 py-1 bg-zinc-800/40"
														>
															<p className="text-zinc-300 break-words">
																<span className="text-zinc-500">
																	Section {Number(secIdx) + 1}:
																</span>{" "}
																{sec.phrase}
															</p>
															<p className="text-[10px] mt-0.5 break-words">
																<span className="text-zinc-500">
																	Your Attempts:
																</span>{" "}
																{sec.attempts.map((a, i) => {
																	const base = "px-1 rounded"
																	const cls = !a.correct
																		? `${base} bg-rose-800/40 text-rose-300`
																		: i === sec.attempts.length - 1
																		? `${base} bg-emerald-700/40 text-emerald-300`
																		: `${base} bg-zinc-700/40 text-zinc-300`
																	return (
																		<span
																			key={i}
																			className={cls}
																		>{`${i + 1}: ${a.text}`}</span>
																	)
																})}
															</p>
															<p className="text-[10px] mt-0.5 break-words">
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
															{sec.referenceDetails &&
																sec.referenceDetails.length > 0 && (
																	<div className="mt-1 space-y-1">
																		{sec.referenceDetails.map((rd, i) => {
																			const lines = getRefLines(
																				rd.key,
																				rd.indices
																			)
																			return (
																				<div
																					key={i}
																					className="text-[10px]"
																				>
																					<p className="text-zinc-500 break-words">
																						Ref: {formatErrorCategory(rd.key)}
																					</p>
																					{lines.map((l, li) => (
																						<p
																							key={li}
																							className="text-zinc-400 leading-snug break-words"
																						>
																							{l}
																						</p>
																					))}
																				</div>
																			)
																		})}
																	</div>
																)}
														</div>
													))}
											</div>
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

function ErrorCategoryRow({
	k,
	v,
	explanations,
}: {
	k: string
	v: number
	explanations?: string[]
}) {
	const readable = React.useMemo(() => formatErrorCategory(k), [k])
	const [open, setOpen] = React.useState(false)
	return (
		<div className="mb-1">
			<button
				onClick={() => setOpen((o) => !o)}
				className="text-xs w-full text-left flex justify-between items-center gap-2 hover:text-zinc-200"
			>
				<span>{readable}</span>
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
