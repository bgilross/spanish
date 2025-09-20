"use client"

import React from "react"
import DebugPanel from "@/components/DebugPanel"
import NextDynamic from "next/dynamic"
import type { SentenceDataEntry } from "@/data/types"
import { simulateLessonOnce } from "@/lib/simulate"
import type { GeneratedQuiz } from "@/lib/quiz/types"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useViewAsUser } from "@/lib/viewAs"
import { useShowCompleteAlways } from "@/lib/adminSettings"

type SentenceObj = {
	id?: number
	sentence?: string
	data?: unknown[]
}

type CurrentSentenceProgress = {
	translationSections?: { index: number; isTranslated?: boolean }[]
}

type CurrentLesson = {
	name?: string
	sentences?: SentenceObj[]
}

const QuizBuilder = NextDynamic(() => import("@/components/quiz/QuizBuilder"), {
	ssr: false,
})

type Props = {
	mounted?: boolean
	isAdmin?: boolean
	rawIsAdmin?: boolean
	userId?: string | null
	currentLesson?: CurrentLesson
	currentLessonIndex?: number
	currentSentenceIndex?: number
	currentSentenceObject?: SentenceObj
	activeIndex?: number | null
	currentSentenceProgress?: CurrentSentenceProgress
	onSelectSentence?: (idx: number) => void
	onClearHistory?: () => Promise<void>
}

export default function AdminPanel({
	mounted = true,
	rawIsAdmin = false,
	userId,
	currentLesson,
	currentLessonIndex = 0,
	currentSentenceIndex = 0,
	currentSentenceObject,
	activeIndex = null,
	currentSentenceProgress,
	onSelectSentence = () => {},
	onClearHistory,
}: Props) {
	const [simulating, setSimulating] = React.useState(false)
	const { data: session } = useSession()
	const router = useRouter()
	const [showQuiz, setShowQuiz] = React.useState(false)
	const [isAdminLocal, setIsAdminLocal] = React.useState<boolean>(false)
	const [viewAsUser] = useViewAsUser()
	const [deleting, setDeleting] = React.useState<string | null>(null)
	const [showCompleteAlways, setShowCompleteAlways] = useShowCompleteAlways()

	const handleSimulate = async () => {
		if (simulating) return
		setSimulating(true)
		try {
			await simulateLessonOnce()
		} finally {
			setSimulating(false)
		}
	}

	React.useEffect(() => {
		// derive admin state from session or local dev fallback
		const sessAdmin = !!(session?.user as { isAdmin?: boolean } | undefined)
			?.isAdmin
		setIsAdminLocal(
			sessAdmin ||
				(process.env.NODE_ENV === "development" &&
					(() => {
						try {
							const raw = localStorage.getItem("dev_admin_users") || "[]"
							const arr = JSON.parse(raw)
							const uid = userId
							return Array.isArray(arr) && uid ? arr.includes(uid) : false
						} catch {
							return false
						}
					})())
		)
	}, [session, userId])

	// viewAsUser comes from shared hook; header control toggles it

	const handleToggleAdmin = async () => {
		if (!userId) return
		const newVal = !isAdminLocal
		try {
			const res = await fetch(`/api/admin/role`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId, isAdmin: newVal }),
			})
			if (!res.ok) throw new Error(await res.text())
			setIsAdminLocal(newVal)
		} catch (e) {
			console.error(
				"Server admin toggle failed, falling back to localStorage",
				e
			)
			// fallback to localStorage
			try {
				const raw = localStorage.getItem("dev_admin_users") || "[]"
				const arr = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : []
				const idx = arr.indexOf(userId)
				if (newVal && idx === -1) arr.push(userId)
				if (!newVal && idx !== -1) arr.splice(idx, 1)
				localStorage.setItem("dev_admin_users", JSON.stringify(arr))
				setIsAdminLocal(newVal)
			} catch (e2) {
				console.error("Failed to persist admin locally", e2)
			}
		}
	}

	const handleDeleteAll = async () => {
		if (!confirm("Delete ALL lesson attempts?")) return
		setDeleting("ALL")
		try {
			if (!userId) {
				try {
					localStorage.removeItem("lessonAttempts:local")
				} catch {}
				return
			}
			await fetch(`/api/lessonAttempts?userId=${encodeURIComponent(userId)}`, {
				method: "DELETE",
			})
		} catch (e) {
			console.error("Failed to delete all attempts", e)
		} finally {
			setDeleting(null)
		}
	}

	const handleViewLocalAttempts = () => {
		try {
			const raw = localStorage.getItem("lessonAttempts:local") || "[]"
			const w = window.open()
			if (w) {
				w.document.body.innerText = raw
				w.document.title = "Local Attempts"
			}
		} catch (e) {
			console.error("Failed to open local attempts", e)
		}
	}

	if (!mounted) return null
	// If viewing-as-user, hide admin UI entirely (header toggle controls this)
	if (viewAsUser) return null
	// Otherwise show panel only to raw admins or dev fallback
	if (!(rawIsAdmin || isAdminLocal || process.env.NODE_ENV === "development"))
		return null

	return (
		<section className="mt-4 p-3 rounded border border-zinc-700 bg-zinc-900/40">
			<div className="flex items-center justify-between gap-4">
				<h3 className="text-sm font-medium">Admin Panel</h3>
				<div className="flex items-center gap-2">
					{/* admin-only toggle: show sentence-complete modal after every sentence */}
					<label className="inline-flex items-center gap-2 text-xs">
						<input
							type="checkbox"
							checked={showCompleteAlways}
							onChange={(e) => setShowCompleteAlways(e.target.checked)}
							className="w-4 h-4"
						/>
						<span className="text-zinc-300">
							Show sentence modal after every sentence
						</span>
					</label>
					{userId && (
						<button
							onClick={onClearHistory}
							className="px-2 py-1 text-[11px] sm:text-xs rounded border border-red-600 text-red-300 hover:bg-red-900/40"
							title="Clear stored lesson attempts for this user"
						>
							Clear History
						</button>
					)}
					{/* view-as-user toggle moved to header; panel will hide when active */}
					{userId && (
						<button
							onClick={handleDeleteAll}
							className="px-2 py-1 text-[11px] sm:text-xs rounded border border-red-600 text-red-300 hover:bg-red-900/40"
							title="Delete ALL lesson attempts for this user"
						>
							{deleting === "ALL" ? "Deleting…" : "Delete All"}
						</button>
					)}
					{userId && (
						<a
							href={`/api/lessonAttempts?userId=${encodeURIComponent(userId)}`}
							target="_blank"
							rel="noopener noreferrer"
							className="px-2 py-1 text-[11px] sm:text-xs rounded border border-zinc-600 hover:bg-zinc-800"
						>
							View API Attempts
						</a>
					)}
					{userId && (
						<a
							href={`/api/mixups?userId=${encodeURIComponent(userId)}`}
							target="_blank"
							rel="noopener noreferrer"
							className="px-2 py-1 text-[11px] sm:text-xs rounded border border-zinc-600 hover:bg-zinc-800"
						>
							View API Mixups
						</a>
					)}
					{process.env.NODE_ENV === "development" && (
						<button
							onClick={handleViewLocalAttempts}
							className="px-2 py-1 text-[11px] sm:text-xs rounded border border-zinc-600 hover:bg-zinc-800"
						>
							View Local Attempts
						</button>
					)}
					{process.env.NODE_ENV === "development" && (
						<button
							onClick={handleToggleAdmin}
							className="px-2 py-1 text-[11px] sm:text-xs rounded border border-zinc-600 hover:bg-zinc-800"
						>
							{isAdminLocal ? "Revoke Admin" : "Promote to Admin"}
						</button>
					)}
					<a
						href="/api/quiz/debug"
						className="text-[10px] px-2 py-1 rounded border border-zinc-700 hover:bg-zinc-800 text-zinc-400"
						target="_blank"
						rel="noopener noreferrer"
					>
						Debug Topics
					</a>
					<a
						href="/api/quiz/debug?reset=1"
						className="text-[10px] px-2 py-1 rounded border border-amber-600/50 hover:bg-amber-900/30 text-amber-400"
						target="_blank"
						rel="noopener noreferrer"
						title="Force rebuild quiz index"
					>
						Reset Index
					</a>
					<button
						type="button"
						onClick={() => setShowQuiz(true)}
						className="text-xs px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-black font-medium border border-emerald-500/60"
					>
						Create Custom Quiz
					</button>
					<button
						onClick={() => router.push("/dashboard/reports")}
						className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-zinc-600 hover:bg-zinc-800 transition-colors"
					>
						Reports
					</button>
				</div>
				{showQuiz && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur">
						<div className="w-full max-w-4xl max-h-[90vh] overflow-auto bg-zinc-950 border border-zinc-700 rounded-lg p-6 relative shadow-xl">
							<button
								onClick={() => setShowQuiz(false)}
								className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-200 text-sm"
								aria-label="Close"
							>
								✕
							</button>
							<QuizBuilder
								onStart={(quiz: GeneratedQuiz) => {
									try {
										sessionStorage.setItem(
											"customQuiz:active",
											JSON.stringify(quiz)
										)
									} catch {}
									setShowQuiz(false)
									window.location.href = "/quiz/session"
								}}
							/>
						</div>
					</div>
				)}
			</div>

			<div className="mt-3 flex items-center gap-3">
				<div className="flex items-center gap-2">
					<span className="text-zinc-400 text-xs">Sentence:</span>
					{currentLesson?.sentences?.length ? (
						<select
							aria-label="Admin select sentence"
							value={currentSentenceIndex}
							onChange={(e) => onSelectSentence(Number(e.target.value))}
							className="ml-1 bg-zinc-900 border border-zinc-700 text-sm px-2 py-1 rounded"
						>
							{Array.from({ length: currentLesson.sentences.length }).map(
								(_, i) => (
									<option
										key={i}
										value={i}
									>
										{i + 1}
									</option>
								)
							)}
						</select>
					) : (
						<span className="text-xs text-zinc-500">—</span>
					)}
				</div>
				<div className="ml-4">
					<button
						onClick={handleSimulate}
						disabled={simulating}
						className="px-2 py-1 rounded border border-zinc-700 bg-zinc-800 text-sm"
						title="Simulate lesson (admin)"
					>
						{simulating ? "Simulating…" : "Simulate"}
					</button>
				</div>
			</div>

			<div className="mt-4">
				<DebugPanel
					currentLessonIndex={currentLessonIndex}
					currentSentenceIndex={currentSentenceIndex}
					sentenceText={currentSentenceObject?.sentence}
					activeIndex={activeIndex}
					currentSentenceData={
						(currentSentenceObject?.data as SentenceDataEntry[] | undefined) ||
						undefined
					}
					translationSections={(
						currentSentenceProgress?.translationSections || []
					).map((s) => ({
						index: s.index,
						isTranslated: !!s.isTranslated,
					}))}
				/>
			</div>
		</section>
	)
}
