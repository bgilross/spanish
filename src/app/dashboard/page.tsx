import React from "react"
import { ProgressDashboard } from "@/components/ProgressDashboard"

export const dynamic = "force-dynamic"

export default function DashboardPage() {
	return (
		<div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-zinc-100 px-4 pb-16">
			<div className="w-full max-w-5xl pt-8">
				<h1 className="text-2xl font-semibold tracking-tight mb-6">
					Progress Dashboard
				</h1>
				<ProgressDashboard />
			</div>
		</div>
	)
}
