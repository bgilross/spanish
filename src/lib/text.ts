export function normalizeText(s: string) {
	return s
		.toLowerCase()
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.replace(/[^a-z0-9']+/g, " ")
		.trim()
}

export function splitWordAndPunct(text: string): {
	base: string
	punct: string
} {
	const m = text.match(/^([\s\S]*?)([.,!?:;…]+)$/)
	if (!m) return { base: text, punct: "" }
	return { base: m[1], punct: m[2] }
}

export function approxChWidth(text: string, minCh = 3, maxCh = 20): number {
	const clean = text.replace(/[^A-Za-z0-9'áéíóúüñÁÉÍÓÚÜÑ]+/g, "")
	const len = clean.length || minCh
	return Math.max(minCh, Math.min(len, maxCh))
}
