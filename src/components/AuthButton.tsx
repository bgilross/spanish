"use client"
import { signIn, signOut, useSession } from "next-auth/react"

export function AuthButton() {
	const { data: session, status } = useSession()
	if (status === "loading")
		return <button className="text-xs opacity-70">Auth...</button>
	if (!session?.user) {
		return (
			<button
				className="px-2 py-1 text-xs rounded border border-zinc-500 hover:bg-zinc-800"
				onClick={() => signIn("google")}
			>
				Sign in with Google
			</button>
		)
	}
	return (
		<div className="flex items-center gap-2">
			<span
				className="text-xs text-zinc-300 max-w-[140px] truncate"
				title={session.user.email || session.user.name || session.user.id}
			>
				{session.user.name || session.user.email || "User"}
			</span>
			<button
				className="px-2 py-1 text-xs rounded border border-zinc-500 hover:bg-zinc-800"
				onClick={() => signOut()}
			>
				Logout
			</button>
		</div>
	)
}
