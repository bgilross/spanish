"use client"

import React from "react"

const STORAGE_KEY = "admin:showSentenceCompleteEverySentence:v1"

export function getShowCompleteAlways(): boolean {
	try {
		if (typeof window === "undefined" || !window.localStorage) return false
		const v = window.localStorage.getItem(STORAGE_KEY)
		return v === "1"
	} catch {
		return false
	}
}

export function setShowCompleteAlways(val: boolean) {
	try {
		if (typeof window === "undefined" || !window.localStorage) return
		window.localStorage.setItem(STORAGE_KEY, val ? "1" : "0")
		window.dispatchEvent(new Event("admin:showCompleteAlways:change"))
	} catch {}
}

export function useShowCompleteAlways() {
	const [state, setState] = React.useState<boolean>(() =>
		getShowCompleteAlways()
	)
	React.useEffect(() => {
		const onChange = () => setState(getShowCompleteAlways())
		window.addEventListener("admin:showCompleteAlways:change", onChange)
		return () =>
			window.removeEventListener("admin:showCompleteAlways:change", onChange)
	}, [])
	const setter = React.useCallback((v: boolean) => setShowCompleteAlways(v), [])
	return [state, setter] as const
}

export default useShowCompleteAlways
