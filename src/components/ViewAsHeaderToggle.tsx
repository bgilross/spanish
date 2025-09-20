"use client"

import React from "react"
import { useSession } from "next-auth/react"
import { setViewAsUser, useViewAsUser } from "@/lib/viewAs"

export default function ViewAsHeaderToggle({ mounted }: { mounted?: boolean }) {
	const { data: session } = useSession()
	const [viewAsUser, setViewAsUserState] = useViewAsUser()
	const [isAdminLocal, setIsAdminLocal] = React.useState(false)
	React.useEffect(() => {
		try {
			const sessAdmin = !!(session?.user as { isAdmin?: boolean } | undefined)
				?.isAdmin
			if (sessAdmin) {
				setIsAdminLocal(true)
				return
			}
			const raw = localStorage.getItem("dev_admin_users") || "[]"
			const arr = JSON.parse(raw)
			const uid = (session?.user as { id?: string } | undefined)?.id
			setIsAdminLocal(Array.isArray(arr) && uid ? arr.includes(uid) : false)
		} catch {
			setIsAdminLocal(false)
		}
	}, [session])

	if (!mounted) return null
	if (!isAdminLocal) return null

	return (
		<label className="inline-flex items-center gap-2 text-xs text-zinc-300">
			<input
				type="checkbox"
				className="accent-emerald-600"
				checked={viewAsUser}
				onChange={(e) => {
					const v = e.target.checked
					try {
						setViewAsUser(v)
						setViewAsUserState(v)
					} catch {}
				}}
				aria-label="View page as regular user"
			/>
			<span>View as user</span>
		</label>
	)
}
