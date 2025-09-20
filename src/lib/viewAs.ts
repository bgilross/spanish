import React from "react"

const KEY = "view_as_user"

export function getViewAsUser(): boolean {
	try {
		if (typeof window === "undefined") return false
		return localStorage.getItem(KEY) === "1"
	} catch {
		return false
	}
}

export function setViewAsUser(val: boolean) {
	try {
		if (typeof window === "undefined") return
		localStorage.setItem(KEY, val ? "1" : "0")
		// notify listeners
		window.dispatchEvent(new Event("viewAsUserChange"))
	} catch {}
}

export function useViewAsUser() {
	const [viewAsUser, setViewAsUserState] = React.useState<boolean>(() =>
		getViewAsUser()
	)
	React.useEffect(() => {
		const onChange = () => setViewAsUserState(getViewAsUser())
		window.addEventListener("viewAsUserChange", onChange)
		return () => window.removeEventListener("viewAsUserChange", onChange)
	}, [])
	const setter = React.useCallback((v: boolean) => setViewAsUser(v), [])
	return [viewAsUser, setter] as const
}
