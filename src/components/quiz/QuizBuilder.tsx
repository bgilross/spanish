"use client"
import React from "react"
import TopicTree from "./TopicTree"
import type { TopicNode, GeneratedQuiz } from "@/lib/quiz/types"

interface QuizBuilderProps {
	onStart: (quiz: GeneratedQuiz) => void
}

const QuizBuilder: React.FC<QuizBuilderProps> = ({ onStart }) => {
	const [topics, setTopics] = React.useState<TopicNode[] | null>(null)
	const [loading, setLoading] = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)
	const [questionCount, setQuestionCount] = React.useState(15)
	const [selected, setSelected] = React.useState<Set<string>>(new Set())
	const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({})
	const [preview, setPreview] = React.useState<GeneratedQuiz | null>(null)
	const [seed, setSeed] = React.useState<string>("")

	React.useEffect(() => {
		let mounted = true
		;(async () => {
			try {
				const res = await fetch("/api/quiz/topics")
				if (!res.ok) throw new Error("Failed to load topics")
				const data = await res.json()
				if (mounted) setTopics(data.topics as TopicNode[])
			} catch (e: unknown) {
				if (mounted) setError(e instanceof Error ? e.message : "Failed to load")
			}
		})()
		return () => {
			mounted = false
		}
	}, [])

	// When topics load, initialize collapsed map so all nodes are collapsed by default
	React.useEffect(() => {
		if (!topics) return
		const map: Record<string, boolean> = {}
		const walk = (ns: TopicNode[]) =>
			ns.forEach((n) => {
				map[n.id] = true
				if (n.children) walk(n.children)
			})
		walk(topics)
		setCollapsed(map)
	}, [topics])

	const toggleTopic = (id: string) => {
		setSelected((prev) => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}

	const handleGenerate = async (previewOnly = false) => {
		if (selected.size === 0) return
		setLoading(true)
		setError(null)
		try {
			const res = await fetch("/api/quiz/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					questionCount,
					topics: Array.from(selected),
					seed: seed || undefined,
				}),
			})
			const data = await res.json()
			if (!res.ok) throw new Error(data.error || "Failed to generate")
			setPreview(data)
			if (!previewOnly) onStart(data as GeneratedQuiz)
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Error generating quiz")
		} finally {
			setLoading(false)
		}
	}

	const selectedList = Array.from(selected)

	// Compute aggregate candidate pool size for selected topics (union)
	const candidatePoolSize = React.useMemo(() => {
		if (!topics || selected.size === 0) return 0
		// Build map id -> node for quick lookup
		const idMap = new Map<string, TopicNode>()
		const walk = (ns: TopicNode[]) =>
			ns.forEach((n) => {
				idMap.set(n.id, n)
				if (n.children) walk(n.children)
			})
		walk(topics)
		// Since we don't have explicit sentence lists on client, we approximate by summing counts (overestimates with overlap).
		let sum = 0
		selected.forEach((id) => {
			const node = idMap.get(id)
			if (!node) return
			if (node.candidateCount) sum += node.candidateCount
		})
		return sum // approximate
	}, [topics, selected])

	const shortfall = candidatePoolSize > 0 && candidatePoolSize < questionCount

	// Build debug URL for currently selected topics
	const debugUrl = React.useMemo(() => {
		if (selected.size === 0) return "/api/quiz/debug"
		const params = Array.from(selected)
			.map((t) => `t=${encodeURIComponent(t)}`)
			.join("&")
		return `/api/quiz/debug?${params}`
	}, [selected])

	return (
		<div className="space-y-4">
			<h2 className="text-lg font-semibold">Custom Quiz Builder</h2>
			{error && <div className="text-sm text-red-400">{error}</div>}
			<div className="flex flex-wrap gap-4 items-end">
				<div>
					<label className="block text-xs uppercase tracking-wide mb-1 text-zinc-400">
						Questions
					</label>
					<input
						type="number"
						min={10}
						max={50}
						value={questionCount}
						onChange={(e) =>
							setQuestionCount(
								Math.min(50, Math.max(10, parseInt(e.target.value) || 10))
							)
						}
						className="w-24 px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-sm"
					/>
				</div>
				<div>
					<label className="block text-xs uppercase tracking-wide mb-1 text-zinc-400">
						Seed (optional)
					</label>
					<input
						type="text"
						value={seed}
						onChange={(e) => setSeed(e.target.value)}
						placeholder="e.g. practice-1"
						className="w-36 px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-sm"
					/>
				</div>
				<div className="flex-1 min-w-[14rem]">
					<label className="block text-xs uppercase tracking-wide mb-1 text-zinc-400">
						Selected Topics ({selected.size})
					</label>
					<div className="flex flex-wrap gap-2 min-h-[2.25rem]">
						{selectedList.map((id) => (
							<button
								key={id}
								type="button"
								onClick={() => toggleTopic(id)}
								className="text-[10px] px-2 py-1 rounded bg-emerald-700/40 border border-emerald-600/40 hover:bg-emerald-600/40"
							>
								{topics &&
									(() => {
										// lookup pathLabel
										const findNode = (
											nodes: TopicNode[]
										): TopicNode | undefined => {
											for (const n of nodes) {
												if (n.id === id) return n
												if (n.children) {
													const f = findNode(n.children)
													if (f) return f
												}
											}
											return undefined
										}
										const node = findNode(topics)
										return node?.pathLabel || id
									})()}
							</button>
						))}
						{selectedList.length === 0 && (
							<span className="text-[10px] text-zinc-500 self-center">
								None selected
							</span>
						)}
					</div>
				</div>
				<div className="flex gap-2">
					<button
						type="button"
						disabled={loading || selected.size === 0}
						onClick={() => handleGenerate(true)}
						className="px-3 py-1.5 text-xs rounded bg-zinc-800 border border-zinc-600 disabled:opacity-40 hover:bg-zinc-700"
					>
						Preview
					</button>
					<button
						type="button"
						disabled={loading || selected.size === 0}
						onClick={() => handleGenerate(false)}
						className="px-3 py-1.5 text-xs rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-black font-medium"
					>
						{loading ? "Generating…" : "Start Quiz"}
					</button>
				</div>
			</div>
			<div className="flex gap-2">
				{/* Expand / Collapse all controls */}
				<button
					type="button"
					onClick={() => {
						if (!topics) return
						// build map of ids and set to true (collapsed)
						const map: Record<string, boolean> = {}
						const walk = (ns: TopicNode[]) =>
							ns.forEach((n) => {
								map[n.id] = true
								if (n.children) walk(n.children)
							})
						walk(topics)
						setCollapsed(map)
					}}
					className="px-2 py-1 text-xs rounded bg-zinc-800 border border-zinc-700 hover:bg-zinc-700"
				>
					Collapse all
				</button>
				<button
					type="button"
					onClick={() => {
						if (!topics) return
						// build map of ids and set to false (expanded)
						const map: Record<string, boolean> = {}
						const walk = (ns: TopicNode[]) =>
							ns.forEach((n) => {
								map[n.id] = false
								if (n.children) walk(n.children)
							})
						walk(topics)
						setCollapsed(map)
					}}
					className="px-2 py-1 text-xs rounded bg-zinc-800 border border-zinc-700 hover:bg-zinc-700"
				>
					Expand all
				</button>
			</div>
			{/* Debug Links */}
			<div className="flex flex-wrap gap-3 text-[10px] mt-2">
				<a
					href="/api/quiz/debug"
					target="_blank"
					rel="noopener noreferrer"
					className="underline text-zinc-400 hover:text-zinc-200"
				>
					All Topics Debug
				</a>
				<a
					href={debugUrl}
					target="_blank"
					rel="noopener noreferrer"
					className={`underline ${
						selected.size === 0
							? "pointer-events-none opacity-40"
							: "text-emerald-400 hover:text-emerald-200"
					}`}
				>
					Selected Topics Debug
				</a>
			</div>
			{shortfall && (
				<div className="text-xs text-amber-400 bg-amber-900/20 border border-amber-700/40 rounded p-2">
					Warning: Total candidate pool (~{candidatePoolSize}) is smaller than
					requested question count ({questionCount}). Quiz will reuse overlap to
					fill.
				</div>
			)}
			<div className="max-h-96 overflow-auto pr-1 space-y-2">
				{topics ? (
					<TopicTree
						nodes={topics}
						selected={selected}
						onToggle={toggleTopic}
						collapsed={collapsed}
						onCollapseChange={(id, c) =>
							setCollapsed((p) => ({ ...p, [id]: c }))
						}
					/>
				) : (
					<div className="text-xs text-zinc-500">Loading topics…</div>
				)}
			</div>
			{preview && (
				<div className="mt-4 border border-zinc-700 rounded p-3 bg-zinc-900/50 space-y-1">
					<div className="text-xs text-zinc-400">
						Preview ({preview.questions.length} questions)
					</div>
					<ol className="list-decimal list-inside text-sm space-y-0.5">
						{preview.questions.slice(0, 5).map((q) => (
							<li
								key={q.sentenceId}
								className="truncate"
							>
								{q.sentence.sentence}
							</li>
						))}
					</ol>
					{preview.questions.length > 5 && (
						<div className="text-[10px] text-zinc-500">
							…and {preview.questions.length - 5} more
						</div>
					)}
				</div>
			)}
		</div>
	)
}

export default QuizBuilder
