import spanishWords from "@/data/spanishWords"
import type { WordObject } from "@/data/types"
import { isWordObject } from "@/lib/translation"

export type ResolvedRef = {
	key: string
	label: string
	groupName?: string
	word?: WordObject
	info?: string[]
}

function traversePath(obj: unknown, path: string[]): unknown {
	// Use a loose index signature view
	let cur: unknown = obj
	for (const seg of path) {
		if (
			cur &&
			typeof cur === "object" &&
			seg in (cur as Record<string, unknown>)
		) {
			cur = (cur as Record<string, unknown>)[seg]
		} else {
			return undefined
		}
	}
	return cur
}

export function resolveReference(
	key: string,
	indices?: Array<number | string>
): ResolvedRef {
	const parts = key.split(".")
	const groupKey = parts[0]
	const groupCandidate = (spanishWords as unknown as Record<string, unknown>)[
		groupKey
	]
	const groupName: string | undefined =
		groupCandidate &&
		typeof groupCandidate === "object" &&
		typeof (groupCandidate as Record<string, unknown>).name === "string"
			? ((groupCandidate as Record<string, unknown>).name as string)
			: undefined

	const target = traversePath(spanishWords as unknown, parts)
	let wordObj: WordObject | undefined
	if (isWordObject(target)) {
		wordObj = target
	}

	const label = wordObj
		? `${wordObj.word} — ${wordObj.pos || groupName || groupKey}`
		: groupName
		? `${groupName} — ${key}`
		: key

	let info: string[] | undefined
	if (wordObj && Array.isArray(wordObj.info) && wordObj.info.length) {
		if (Array.isArray(indices) && indices.length) {
			const nums = indices
				.map((i) => (typeof i === "number" ? i : Number.NaN))
				.filter((n) => Number.isFinite(n)) as number[]
			const picked = nums
				.map((i) => wordObj!.info[i])
				.filter((v): v is string => typeof v === "string")
			info = picked.length ? picked : undefined
		}
		// Fallback: no indices, pick the first one or two lines
		if (!info) info = wordObj.info.slice(0, 2)
	}

	return { key, label, groupName, word: wordObj, info }
}

export function resolveReferenceList(
	refs: Record<string, (number | string)[]> | undefined
) {
	if (!refs) return [] as ResolvedRef[]
	return Object.entries(refs).map(([k, idx]) => resolveReference(k, idx))
}
