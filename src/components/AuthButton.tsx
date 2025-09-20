"use client"
import { signIn, signOut, useSession } from "next-auth/react"
import React from "react"

export function AuthButton() {
	const { data: session, status } = useSession()
	const [mounted, setMounted] = React.useState(false)
	React.useEffect(() => setMounted(true), [])

	// Avoid rendering different HTML on server vs client. Render nothing until mounted.
	if (!mounted) return null

	if (status === "loading")
		return (
			<button className="px-3 py-2 text-sm rounded border border-zinc-500 opacity-70">
				Auth...
			</button>
		)
	if (!session?.user) {
		return (
			<button
				className="px-3 py-2 text-sm rounded border border-zinc-500 hover:bg-zinc-800"
				onClick={() => signIn("google")}
			>
				Sign in with Google
			</button>
		)
	}
	const userId = (session.user as { id?: string } | undefined)?.id
	return (
		<div className="flex items-center gap-2">
			{userId && (
				<a
					href="/dashboard"
					className="px-3 py-2 text-sm rounded border border-zinc-600 hover:bg-zinc-800"
				>
					Dashboard
				</a>
			)}
			<span
				className="text-sm text-zinc-300 max-w-[180px] truncate"
				title={session.user.email || session.user.name || userId || "User"}
			>
				{session.user.name || session.user.email || userId || "User"}
			</span>
			<button
				className="px-3 py-2 text-sm rounded border border-zinc-500 hover:bg-zinc-800"
				onClick={() => signOut()}
			>
				Logout
			</button>
		</div>
	)
}
