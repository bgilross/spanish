#!/usr/bin/env node
const spanishData = require("../src/data/spanishData").default
const words = require("../src/data/spanishWords").default
const { spanishTarget } = require("../src/lib/translation")

function stripAccents(s) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").normalize()
}

function buildVocabSet() {
  const set = new Set()
  function collect(obj) {
    if (!obj || typeof obj !== "object") return
    if (obj.word && typeof obj.word === "string") set.add(stripAccents(obj.word.toLowerCase()))
    if (obj.words && typeof obj.words === "object") {
      for (const v of Object.values(obj.words)) collect(v)
    }
    for (const v of Object.values(obj)) if (typeof v === "object") collect(v)
  }
  collect(words)
  return set
}

const VOCAB = buildVocabSet()

function extractTokensFromSentenceTranslation(translation) {
  const matches = String(translation).match(/[A-ZÁÉÍÓÚÑÜ]+/g)
  if (!matches) return []
  return Array.from(new Set(matches.map((m) => stripAccents(m.toLowerCase())).filter((t) => VOCAB.has(t))))
}

function tokensFromTargetString(target) {
  if (!target) return []
  return Array.from(new Set(String(target)
    .replace(/[?!.;,]/g, " ")
    .split(/\s+/)
    .map((t) => stripAccents(String(t).trim().toLowerCase()))
    .filter(Boolean)
    .filter((t) => VOCAB.has(t))))
}

function resolveReferenceKey(refKey) {
  const parts = refKey.split(".")
  let cur = words
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return null
    if (cur[p]) cur = cur[p]
    else if (cur.words && cur.words[p]) cur = cur.words[p]
    else return null
  }
  if (typeof cur === "object" && cur.word) return stripAccents(String(cur.word).toLowerCase())
  return null
}

function tokensFromEntry(entry) {
  const viaTarget = spanishTarget(entry)
  const tks = tokensFromTargetString(viaTarget)
  const ref = (entry && entry.reference) || {}
  for (const k of Object.keys(ref)) {
    const resolved = resolveReferenceKey(k)
    if (resolved) tks.push(resolved)
  }
  return Array.from(new Set(tks))
}

function runValidation() {
  const results = []
  for (const lesson of spanishData.lessons || []) {
    for (const s of lesson.sentences || []) {
      const issues = []
      const trans = typeof s.translation === "string" ? s.translation : String(s.translation || "")
      const sentenceTokens = extractTokensFromSentenceTranslation(trans)

      const sectionTokens = []
      for (const entry of s.data || []) {
        if (entry && entry.translation) {
          const fromEntry = tokensFromEntry(entry)
          sectionTokens.push(...fromEntry)
        }
      }

      const stSet = new Set(sentenceTokens)
      const secSet = new Set(sectionTokens)

      const missing = Array.from(stSet).filter((t) => !secSet.has(t))
      if (missing.length) issues.push(`Tokens present in sentence translation but NOT found in any section translations: ${missing.join(", ")}`)

      const extra = Array.from(secSet).filter((t) => !stSet.has(t))
      if (extra.length) issues.push(`Tokens present in section translations but NOT found in sentence translation: ${extra.join(", ")}`)

      if (issues.length) results.push({ lesson: lesson.lesson, sentenceId: s.id ?? null, sentence: s.sentence, issues })
    }
  }

  if (results.length === 0) {
    console.log("No translation-token mismatches detected!")
    return 0
  }

  for (const r of results) {
    console.log(`\nLesson ${r.lesson} — sentence id=${r.sentenceId} — ${r.sentence}`)
    for (const i of r.issues) console.log("  -", i)
  }
  console.log(`\nFound ${results.length} sentences with issues.`)
  return 1
}

const code = runValidation()
process.exit(code)
