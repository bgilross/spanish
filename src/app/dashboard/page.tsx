import React from "react"
import Link from "next/link"
import { ProgressDashboard } from "@/components/ProgressDashboard"
import NextDynamic from "next/dynamic"
import { APP_VERSION } from "@/lib/version"
import type { GeneratedQuiz } from "@/lib/quiz/types"

const QuizBuilder = NextDynamic(() => import("@/components/quiz/QuizBuilder"), {
	ssr: false,
})

export const dynamic = "force-dynamic"

export default function DashboardPage() {
	const [showQuiz, setShowQuiz] = React.useState(false)
	return (
		<div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-zinc-100 px-4 pb-16">
			<div className="w-full max-w-5xl pt-8 space-y-4">
				<div className="flex items-center justify-between flex-wrap gap-3">
					<h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
						Progress Dashboard
						<span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-200 font-mono">
							v{APP_VERSION}
						</span>
					</h1>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => setShowQuiz(true)}
							className="text-xs px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-black font-medium border border-emerald-500/60"
						>
							Create Custom Quiz
						</button>
						<Link
							href="/"
							className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-zinc-600 hover:bg-zinc-800 transition-colors"
							prefetch={false}
						>
							<span aria-hidden>←</span> Back to Lessons
						</Link>
					</div>
				</div>
				<ProgressDashboard />
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
	)
}
