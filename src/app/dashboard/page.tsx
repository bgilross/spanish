import React from "react"
import Link from "next/link"
import { ProgressDashboard } from "@/components/ProgressDashboard"

export const dynamic = "force-dynamic"

export default function DashboardPage() {
	return (
		<div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-zinc-100 px-4 pb-16">
			<div className="w-full max-w-5xl pt-8 space-y-4">
				<div className="flex items-center justify-between flex-wrap gap-3">
					<h1 className="text-2xl font-semibold tracking-tight">
						Progress Dashboard
					</h1>
					<Link
						href="/"
						className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-zinc-600 hover:bg-zinc-800 transition-colors"
						prefetch={false}
					>
						<span aria-hidden>←</span> Back to Lessons
					</Link>
				</div>
				<ProgressDashboard />
			</div>
		</div>
	)
}
