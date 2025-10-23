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

// --- Admin panel visibility (available to all users as a view toggle) ---
const ADMIN_PANEL_KEY = "admin:showPanel:v1"

export function getShowAdminPanel(): boolean {
	try {
		if (typeof window === "undefined" || !window.localStorage) return false
		const v = window.localStorage.getItem(ADMIN_PANEL_KEY)
		return v === "1"
	} catch {
		return false
	}
}

export function setShowAdminPanel(val: boolean) {
	try {
		if (typeof window === "undefined" || !window.localStorage) return
		window.localStorage.setItem(ADMIN_PANEL_KEY, val ? "1" : "0")
		window.dispatchEvent(new Event("admin:showPanel:change"))
	} catch {}
}

export function useShowAdminPanel() {
	const [state, setState] = React.useState<boolean>(() => getShowAdminPanel())
	React.useEffect(() => {
		const onChange = () => setState(getShowAdminPanel())
		window.addEventListener("admin:showPanel:change", onChange)
		return () => window.removeEventListener("admin:showPanel:change", onChange)
	}, [])
	const setter = React.useCallback((v: boolean) => setShowAdminPanel(v), [])
	return [state, setter] as const
}
