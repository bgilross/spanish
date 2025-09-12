#!/usr/bin/env node
const fs = require("fs")
const path = require("path")

function readFile(p) {
	return fs.readFileSync(path.resolve(p), "utf8")
}

const dataText = readFile("src/data/spanishData.tsx")
const wordsText = readFile("src/data/spanishWords.tsx")

function stripAccents(s) {
	if (!s) return s
	return s
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.normalize()
}

function buildWordMapFromWordsText(text) {
	const map = new Map()
	// Look for objects that contain id: "..." and word: "..." within the same object
	const re =
		/id\s*:\s*["']([a-zA-Z0-9_.]+)["'][\s\S]{0,200}?word\s*:\s*["']([^"']+)["']/g
	let m
	while ((m = re.exec(text))) {
		const id = m[1]
		const word = m[2]
		map.set(id, stripAccents(word.toLowerCase()))
	}
	// also try fallback: simple key: { word: "x" } patterns where key is the id path
	const re2 =
		/([a-zA-Z0-9_.]+)\s*:\s*\{[\s\S]{0,200}?word\s*:\s*["']([^"']+)["']/g
	while ((m = re2.exec(text))) {
		const id = m[1]
		const word = m[2]
		if (!map.has(id)) map.set(id, stripAccents(word.toLowerCase()))
	}
	return map
}

const WORDMAP = buildWordMapFromWordsText(wordsText)

function extractEntriesForSentences(text) {
	// Find each sentence object by locating `translation: "..."` and then extracting surrounding fields
	const lines = text.split(/\r?\n/)
	const results = []
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]
		const trMatch =
			line.match(/translation:\s*(["'])([^"']+)\1/) ||
			line.match(/translation:\s*([A-Z0-9_\.]+)/)
		if (trMatch) {
			const translation = trMatch[2] || trMatch[1]
			let id = null
			let sentence = ""
			for (let j = i - 8; j <= i; j++) {
				if (j < 0) continue
				const l = lines[j]
				const idm = l.match(/id\s*:\s*(\d+)/)
				if (idm) id = Number(idm[1])
				const sm = l.match(/sentence:\s*(["'])([^"']+)\1/)
				if (sm) sentence = sm[2]
			}
			// collect data entries: scan forward until we hit a line that starts a new sentence or closes the array
			const dataEntries = []
			let k = i + 1
			let depth = 0
			while (k < lines.length) {
				const l = lines[k]
				if (/^\s*\],?/.test(l) && depth === 0) break
				if (/^\s*\},?\s*$/.test(l) && depth === 0) {
					// end of object
				}
				// track bracket depth for nested objects
				for (const ch of l) {
					if (ch === "[") depth++
					if (ch === "]") depth--
				}
				const p = l.match(/phrase:\s*(["'])([^"']+)\1/)
				const ref = l.match(/reference:\s*\{([^}]*)\}/)
				// capture translation keys inside data entry lines (e.g., translation: "conj.words.que")
				const tkeys = []
				const tmatch = l.match(/translation:\s*(["'])([^"']+)\1/)
				if (tmatch) tkeys.push(tmatch[2])
				// also handle translation: [ 'id1', 'id2' ] on multiple lines (naive)
				const arrMatch = l.match(/translation:\s*\[([^\]]+)\]/)
				if (arrMatch) {
					const inner = arrMatch[1]
					const keyRe = /["']([a-zA-Z0-9_.]+)["']/g
					let km
					while ((km = keyRe.exec(inner))) tkeys.push(km[1])
				}
				const refKeys = []
				if (ref) {
					const keyRe = /["']([a-zA-Z0-9_.]+)["']/g
					let km
					while ((km = keyRe.exec(ref[1]))) refKeys.push(km[1])
				}
				if (p || refKeys.length || tkeys.length)
					dataEntries.push({
						phrase: p ? p[2] : null,
						refKeys,
						transKeys: tkeys,
					})
				k++
			}
			results.push({ id, sentence, translation, dataEntries })
		}
	}
	return results
}

function extractTokensFromSentenceTranslation(translation) {
	if (!translation) return []
	// tokens are uppercase words (placeholders) or single letters like A
	const matches = String(translation).match(/[A-ZÁÉÍÓÚÑÜ]+/g)
	if (!matches) return []
	return Array.from(new Set(matches.map((m) => stripAccents(m.toLowerCase()))))
}

function tokensFromEntry(entry) {
	const tks = new Set()
	if (entry.phrase) {
		// phrase may be a literal Spanish token like 'a' or 'no'
		tks.add(stripAccents(entry.phrase.toLowerCase()))
	}
	for (const k of entry.refKeys || []) {
		const resolved = WORDMAP.get(k) || null
		if (resolved) tks.add(resolved)
	}
	for (const k of entry.transKeys || []) {
		const resolved = WORDMAP.get(k) || null
		if (resolved) tks.add(resolved)
		else {
			// maybe the translation key is itself a literal token
			tks.add(stripAccents(k.toLowerCase()))
		}
	}
	return Array.from(tks)
}

const COMMON_TOKENS = new Set([
	"que",
	"eso",
	"de",
	"a",
	"no",
	"el",
	"la",
	"lo",
	"los",
	"las",
	"por",
	"para",
	"con",
	"en",
	"ser",
	"soy",
	"eres",
	"somos",
	"son",
	"me",
	"te",
	"se",
	"un",
	"una",
	"y",
	"o",
])

function buildAllowedTokenSet() {
	const s = new Set(COMMON_TOKENS)
	for (const v of WORDMAP.values()) s.add(v)
	return s
}

const ALLOWED = buildAllowedTokenSet()

function extractAllSentenceObjects(text) {
	const re = /translation\s*:\s*(["'])([^"']+)\1/g
	const results = []
	let m
	while ((m = re.exec(text))) {
		const matchIndex = m.index
		const translation = m[2]
		// find enclosing object by scanning backwards for '{'
		let start = matchIndex
		while (start > 0 && text[start] !== "{") start--
		// find matching closing brace
		let depth = 0
		let end = start
		if (text[start] !== "{") continue
		for (let i = start; i < text.length; i++) {
			const ch = text[i]
			if (ch === "{") depth++
			else if (ch === "}") {
				depth--
				if (depth === 0) {
					end = i
					break
				}
			}
		}
		if (end <= start) continue
		const objText = text.slice(start, end + 1)
		// extract id and sentence
		const idm = objText.match(/id\s*:\s*(\d+)/)
		const sid = idm ? Number(idm[1]) : null
		const sm = objText.match(/sentence\s*:\s*(["'])([^"']+)\1/)
		const sentence = sm ? sm[2] : ""
		// extract data: [ ... ] block inside objText
		const dataMatch = objText.match(/data\s*:\s*\[([\s\S]*?)\]\s*,?/)
		const dataEntries = []
		if (dataMatch) {
			const dataInner = dataMatch[1]
			// find each object in array
			const entryRe = /\{([\s\S]*?)\}(?=\s*,|$)/g
			let em
			while ((em = entryRe.exec(dataInner))) {
				const entryText = em[1]
				const p = entryText.match(/phrase\s*:\s*(["'])([^"']+)\1/)
				const ref = entryText.match(/reference\s*:\s*\{([\s\S]*?)\}/)
				const tkeys = []
				const tmatch = entryText.match(/translation\s*:\s*(["'])([^"']+)\1/)
				if (tmatch) tkeys.push(tmatch[2])
				const arrMatch = entryText.match(/translation\s*:\s*\[([\s\S]*?)\]/)
				if (arrMatch) {
					const inner = arrMatch[1]
					const keyRe = /["']([a-zA-Z0-9_.]+)["']/g
					let km
					while ((km = keyRe.exec(inner))) tkeys.push(km[1])
				}
				const refKeys = []
				if (ref) {
					const keyRe = /["']([a-zA-Z0-9_.]+)["']/g
					let km
					while ((km = keyRe.exec(ref[1]))) refKeys.push(km[1])
				}
				dataEntries.push({ phrase: p ? p[2] : null, refKeys, transKeys: tkeys })
			}
		}
		results.push({ id: sid, sentence, translation, dataEntries })
	}
	return results
}

const results = extractAllSentenceObjects(dataText)

const report = []
for (const r of results) {
	const stAll = extractTokensFromSentenceTranslation(r.translation)
	// filter tokens to allowed set
	const st = stAll.filter((t) => ALLOWED.has(t))
	const sec = []
	for (const e of r.dataEntries) {
		const toks = tokensFromEntry(e).filter((t) => ALLOWED.has(t))
		sec.push(...toks)
	}
	const uniqSec = Array.from(new Set(sec))
	const missing = st.filter((t) => !uniqSec.includes(t))
	const extra = uniqSec.filter((t) => !st.includes(t))
	if (missing.length || extra.length)
		report.push({
			lesson: null,
			id: r.id,
			sentence: r.sentence,
			missing,
			extra,
		})
}

if (report.length === 0) {
	console.log("No issues found by text validator")
	process.exit(0)
}

for (const r of report) {
	console.log(`\nSentence id=${r.id} — ${r.sentence}`)
	if (r.missing.length)
		console.log("  Missing tokens in sections:", r.missing.join(", "))
	if (r.extra.length)
		console.log("  Extra tokens in sections:", r.extra.join(", "))
}

process.exit(1)
