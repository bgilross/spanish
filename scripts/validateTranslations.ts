#!/usr/bin/env node
import spanishData from "../src/data/spanishData"
import words from "../src/data/spanishWords"
import { spanishTarget } from "../src/lib/translation"

function stripAccents(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").normalize()
}

function buildVocabSet() {
  const set = new Set<string>()
  function collect(obj: unknown) {
    if (!obj || typeof obj !== "object") return
    const o = obj as Record<string, unknown>
    if (o.word && typeof o.word === "string") set.add(stripAccents((o.word as string).toLowerCase()))
    if (o.words && typeof o.words === "object") {
      for (const v of Object.values(o.words as Record<string, unknown>)) collect(v)
    }
    for (const v of Object.values(o)) if (typeof v === "object") collect(v)
  }
  collect(words)
  return set
}

const VOCAB = buildVocabSet()

function extractTokensFromSentenceTranslation(translation: string): string[] {
  const matches = translation.match(/[A-ZÁÉÍÓÚÑÜ]+/g)
  if (!matches) return []
  return Array.from(new Set(matches.map((m) => stripAccents(m.toLowerCase())).filter((t) => VOCAB.has(t))))
}

function tokensFromTargetString(target: string | null): string[] {
  if (!target) return []
  return Array.from(
    new Set(
      target
        .replace(/[?!.;,]/g, " ")
        .split(/\s+/)
        .map((t) => stripAccents(t.trim().toLowerCase()))
        .filter(Boolean)
        .filter((t) => VOCAB.has(t))
    )
  )
}

function resolveReferenceKey(refKey: string): string | null {
  const parts = refKey.split(".")
  let cur: unknown = words
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return null
    const o = cur as Record<string, unknown>
    if (o[p]) cur = o[p]
    else if (o.words && (o.words as Record<string, unknown>)[p]) cur = (o.words as Record<string, unknown>)[p]
    else return null
  }
  if (typeof cur === "object" && (cur as Record<string, unknown>).word)
    return stripAccents(String((cur as Record<string, unknown>).word).toLowerCase())
  return null
}

function tokensFromEntry(entry: unknown): string[] {
  const viaTarget = spanishTarget(entry as any)
  const tks = tokensFromTargetString(viaTarget)
  const ref = (entry as Record<string, unknown>)?.reference || {}
  for (const k of Object.keys(ref as Record<string, unknown>)) {
    const resolved = resolveReferenceKey(k)
    if (resolved) tks.push(resolved)
  }
  return Array.from(new Set(tks))
}

function runValidation() {
  const results: Array<{ lesson: number; sentenceId: number | null; sentence: string; issues: string[] }> = []
  for (const lesson of spanishData.lessons || []) {
    for (const s of lesson.sentences || []) {
      const issues: string[] = []
      const trans = typeof s.translation === "string" ? s.translation : String(s.translation || "")
      const sentenceTokens = extractTokensFromSentenceTranslation(trans)

      const sectionTokens: string[] = []
      for (const entry of s.data || []) {
        if ((entry as any).translation) {
          const fromEntry = tokensFromEntry(entry)
          sectionTokens.push(...fromEntry)
        }
      }

      const stSet = new Set(sentenceTokens)
      const secSet = new Set(sectionTokens)

      const missing = Array.from(stSet).filter((t) => !secSet.has(t))
      if (missing.length) {
        issues.push(`Tokens present in sentence translation but NOT found in any section translations: ${missing.join(", ")}`)
      }

      const extra = Array.from(secSet).filter((t) => !stSet.has(t))
      if (extra.length) {
        issues.push(`Tokens present in section translations but NOT found in sentence translation: ${extra.join(", ")}`)
      }

      if (issues.length) {
        results.push({ lesson: lesson.lesson, sentenceId: s.id ?? null, sentence: s.sentence, issues })
      }
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
#!/usr/bin/env node
import spanishData from "../src/data/spanishData"
import words from "../src/data/spanishWords"
import { spanishTarget } from "../src/lib/translation"

function stripAccents(s: string) {
  return s.normalize("NFD").replace(/[0-6f]/g, "").replace(/\p{Diacritic}/gu, "").normalize()
}
  function stripAccents(s: string) {
    // normalize and remove diacritics
    return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").normalize()
  }

function buildVocabSet() {
  const set = new Set<string>()
  function collect(obj: any) {
    if (!obj || typeof obj !== "object") return
    if (obj.word && typeof obj.word === "string") set.add(stripAccents(obj.word.toLowerCase()))
    if (obj.words && typeof obj.words === "object") {
      for (const v of Object.values(obj.words)) collect(v)
    }
    // also descend other nested groups
    for (const v of Object.values(obj)) if (typeof v === "object") collect(v)
  }
    function collect(obj: unknown) {
      if (!obj || typeof obj !== "object") return
      const o = obj as Record<string, unknown>
      if (o.word && typeof o.word === "string") set.add(stripAccents((o.word as string).toLowerCase()))
      if (o.words && typeof o.words === "object") {
        for (const v of Object.values(o.words as Record<string, unknown>)) collect(v)
      }
      // also descend other nested groups
      for (const v of Object.values(o)) if (typeof v === "object") collect(v)
    }
  collect(words)
  return set
}

const VOCAB = buildVocabSet()

function extractTokensFromSentenceTranslation(translation: string): string[] {
  // tokens are uppercase placeholders - capture letter runs and filter by known vocab
  const matches = translation.match(/[A-ZÁÉÍÓÚÑÜ]+/g)
  if (!matches) return []
  const tokens = matches
    .map((m) => stripAccents(m.toLowerCase()))
    .filter((t) => VOCAB.has(t))
  return Array.from(new Set(tokens))
}

function tokensFromTargetString(target: string | null): string[] {
  if (!target) return []
  return Array.from(
    new Set(
      target
        .replace(/[?!.;,]/g, " ")
        .split(/\s+/)
        .map((t) => stripAccents(t.trim().toLowerCase()))
        .filter(Boolean)
        .filter((t) => VOCAB.has(t))
    )
  )
}

function resolveReferenceKey(refKey: string): string | null {
  const parts = refKey.split(".")
  let cur: any = words
  for (const p of parts) {
    if (!cur) return null
    if (cur[p]) cur = cur[p]
    else if (cur.words && cur.words[p]) cur = cur.words[p]
    else return null
  }
  if (typeof cur === "object" && cur.word) return stripAccents(String(cur.word).toLowerCase())
  return null
}
  function resolveReferenceKey(refKey: string): string | null {
    const parts = refKey.split(".")
    let cur: unknown = words
    for (const p of parts) {
      if (!cur || typeof cur !== "object") return null
      const o = cur as Record<string, unknown>
      if (o[p]) cur = o[p]
      else if (o.words && (o.words as Record<string, unknown>)[p]) cur = (o.words as Record<string, unknown>)[p]
      else return null
    }
    if (typeof cur === "object" && (cur as Record<string, unknown>).word)
      return stripAccents(String((cur as Record<string, unknown>).word).toLowerCase())
    return null
  }

function tokensFromEntry(entry: any): string[] {
  const viaTarget = spanishTarget(entry) // may be null
  const tks = tokensFromTargetString(viaTarget)
  // include referenced keys too
  const ref = entry.reference || {}
  for (const k of Object.keys(ref)) {
    const resolved = resolveReferenceKey(k)
    if (resolved) tks.push(resolved)
  }
  return Array.from(new Set(tks))
}
  function tokensFromEntry(entry: unknown): string[] {
    const viaTarget = spanishTarget(entry as any) // may be null
    const tks = tokensFromTargetString(viaTarget)
    // include referenced keys too
    const ref = (entry as Record<string, unknown>)?.reference || {}
    for (const k of Object.keys(ref as Record<string, unknown>)) {
      const resolved = resolveReferenceKey(k)
      if (resolved) tks.push(resolved)
    }
    return Array.from(new Set(tks))
  }

function runValidation() {
  const results: Array<{ lesson: number; sentenceId: number | null; sentence: string; issues: string[] }> = []
  for (const lesson of spanishData.lessons || []) {
    for (const s of lesson.sentences || []) {
      const issues: string[] = []
      const trans = typeof s.translation === 'string' ? s.translation : String(s.translation || '')
      const sentenceTokens = extractTokensFromSentenceTranslation(trans)

      // gather tokens from sections that claim to provide Spanish translations
      const sectionTokens: string[] = []
      for (const entry of s.data || []) {
        if ((entry as any).translation) {
          const fromEntry = tokensFromEntry(entry)
          sectionTokens.push(...fromEntry)
        }
      }

      const stSet = new Set(sentenceTokens)
      const secSet = new Set(sectionTokens)

      // tokens present in sentence but not covered by any section
      const missing = Array.from(stSet).filter((t) => !secSet.has(t))
      if (missing.length) {
        issues.push(`Tokens present in sentence translation but NOT found in any section translations: ${missing.join(', ')}`)
      }

      // tokens present in sections but not present in the sentence translation
      const extra = Array.from(secSet).filter((t) => !stSet.has(t))
      if (extra.length) {
        issues.push(`Tokens present in section translations but NOT found in sentence translation: ${extra.join(', ')}`)
      }

      if (issues.length) {
        results.push({ lesson: lesson.lesson, sentenceId: s.id ?? null, sentence: s.sentence, issues })
      }
    }
  }

  if (results.length === 0) {
    console.log('No translation-token mismatches detected!')
    return 0
  }

  for (const r of results) {
    console.log(`\nLesson ${r.lesson} — sentence id=${r.sentenceId} — ${r.sentence}`)
    for (const i of r.issues) console.log('  -', i)
  }
  console.log(`\nFound ${results.length} sentences with issues.`)
  return 1
}

const code = runValidation()
process.exit(code)
