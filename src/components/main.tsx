"use client"

import React from "react"
import { useDataStore } from "@/data/dataStore"
import { approxChWidth, splitWordAndPunct } from "@/lib/text"
import { spanishTarget, spanishWordCount } from "@/lib/translation"
import type { SentenceDataEntry } from "@/data/types"

const Main = () => {
	const lessons = useDataStore((state) => state.lessons)
	const currentLessonIndex = useDataStore((state) => state.currentLessonIndex)
	const currentSentenceIndex = useDataStore(
		(state) => state.currentSentenceIndex
	)
	const startNewLesson = useDataStore((state) => state.startNewLesson)
	const initializeSentenceProgress = useDataStore(
		(state) => state.initializeSentenceProgress
	)
	const currentSentenceProgress = useDataStore(
		(state) => state.currentSentenceProgress
	)
	const checkCurrentAnswer = useDataStore((state) => state.checkCurrentAnswer)
	const isLessonComplete = useDataStore((state) => state.isLessonComplete)
	const getLessonSummary = useDataStore((state) => state.getLessonSummary)

	const [showSummary, setShowSummary] = React.useState(false)

	const [input, setInput] = React.useState("")

	const handleLessonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const index = parseInt(e.target.value)
		startNewLesson(index)
	}

	const minCh = 3
	const maxCh = 20

	const currentLesson = lessons[currentLessonIndex]
	const currentSentenceObject = currentLesson.sentences?.[currentSentenceIndex]

	// Initialize progress whenever lesson or sentence changes
	React.useEffect(() => {
		initializeSentenceProgress()
		setInput("")
	}, [initializeSentenceProgress, currentLessonIndex, currentSentenceIndex])

	// Open summary when lesson completes
	React.useEffect(() => {
		if (isLessonComplete()) setShowSummary(true)
	}, [
		isLessonComplete,
		currentLessonIndex,
		currentSentenceIndex,
		currentSentenceProgress,
	])

	// Determine the next un-translated section index (original data index), if any
	const activeSectionOriginalIndex: number | null = React.useMemo(() => {
		const sections = currentSentenceProgress?.translationSections ?? []
		const next = sections.find((s) => !s.isTranslated)
		return next ? next.index : null
	}, [currentSentenceProgress])

	// Pretty print phraseTranslation for debug
	function formatPhraseTranslation(entry: SentenceDataEntry): string | null {
		const pt = (entry as { phraseTranslation?: unknown }).phraseTranslation
		if (typeof pt === "string") return pt
		if (Array.isArray(pt)) {
			const vals = pt.filter((x): x is string => typeof x === "string")
			return vals.length ? vals.join(" | ") : null
		}
		return null
	}

	const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
		if (e.key !== "Enter") return
		if (!currentSentenceObject || activeSectionOriginalIndex == null) return

		const { correct } = checkCurrentAnswer(input)
		if (correct) setInput("")
	}

	return (
		<div>
			{/* End-of-lesson Summary Modal */}
			{showSummary &&
				(() => {
					const summary = getLessonSummary()
					return (
						<div className="fixed inset-0 z-50 flex items-center justify-center">
							<div
								className="absolute inset-0 bg-black/50"
								onClick={() => setShowSummary(false)}
							/>
							<div className="relative bg-white text-black dark:bg-zinc-900 dark:text-zinc-50 shadow-xl rounded-lg max-w-3xl w-[90%] p-4">
								<div className="flex items-center justify-between mb-2">
									<h3 className="text-lg font-semibold">
										Lesson {summary.lessonNumber} Summary
									</h3>
									<button
										className="px-2 py-1 text-sm border rounded"
										onClick={() => setShowSummary(false)}
									>
										Close
									</button>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
									<div className="p-2 border rounded">
										<div className="font-medium">Total</div>
										<div>{summary.totalSubmissions}</div>
									</div>
									<div className="p-2 border rounded">
										<div className="font-medium text-green-700">Correct</div>
										<div>{summary.correctCount}</div>
									</div>
									<div className="p-2 border rounded">
										<div className="font-medium text-red-700">Incorrect</div>
										<div>{summary.incorrectCount}</div>
									</div>
								</div>
								{summary.references.length > 0 && (
									<div className="mt-3">
										<div className="font-semibold">
											Common references to review
										</div>
										<ul className="list-disc ml-5 text-sm">
											{summary.references.map((r, idx) => (
												<li key={idx}>{r}</li>
											))}
										</ul>
									</div>
								)}
								<div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[40vh] overflow-auto">
									<div>
										<div className="font-semibold mb-1">Incorrect</div>
										<ul className="text-sm space-y-2">
											{summary.incorrect.length === 0 && (
												<li className="text-zinc-500">None</li>
											)}
											{summary.incorrect.map((s, i) => (
												<li
													key={i}
													className="p-2 border rounded"
												>
													<div className="font-medium">
														{s.sentence.sentence}
													</div>
													<div>Phrase: {s.section.phrase}</div>
													<div>Your input: “{s.userInput}”</div>
													<div>Expected: {s.expected?.join(" | ")}</div>
												</li>
											))}
										</ul>
									</div>
									<div>
										<div className="font-semibold mb-1">Correct</div>
										<ul className="text-sm space-y-2">
											{summary.correct.length === 0 && (
												<li className="text-zinc-500">None</li>
											)}
											{summary.correct.map((s, i) => (
												<li
													key={i}
													className="p-2 border rounded"
												>
													<div className="font-medium">
														{s.sentence.sentence}
													</div>
													<div>Phrase: {s.section.phrase}</div>
													<div>Input: “{s.userInput}”</div>
												</li>
											))}
										</ul>
									</div>
								</div>
							</div>
						</div>
					)
				})()}
			<select
				value={currentLessonIndex}
				onChange={handleLessonChange}
				className="px-2 py-1 border rounded"
			>
				{lessons.map((lesson, i) => (
					<option
						key={i}
						value={i}
					>
						Lesson {lesson.lesson} - {lesson.details}
					</option>
				))}
			</select>

			<div className="mt-4">
				<p>Current Lesson: {currentLesson.name}</p>
				<p>
					Current Sentence Index: {currentSentenceIndex + 1} /{" "}
					{currentLesson.sentences?.length}
				</p>
				<p> {currentSentenceObject?.sentence}</p>

				<div className="mt-2">
					{(() => {
						const toTranslate = new Set(
							currentSentenceProgress?.translationSections.map(
								(s) => s.index
							) ?? []
						)
						const translated = new Set(
							currentSentenceProgress?.translationSections
								.filter((s) => s.isTranslated)
								.map((s) => s.index) ?? []
						)
						return currentSentenceObject?.data.map((part, i) => {
							const shouldBeBlank = toTranslate.has(i)
							const isRevealed = translated.has(i)
							const { base, punct } = splitWordAndPunct(part.phrase)

							const isActive = i === activeSectionOriginalIndex
							const content =
								shouldBeBlank && !isRevealed ? (
									<span
										className={
											"inline-block align-baseline border-b-2 h-[1.1em] leading-[1.1em] mx-1 select-none " +
											(isActive ? "border-blue-600" : "border-current")
										}
										style={{ width: `${approxChWidth(base, minCh, maxCh)}ch` }}
										aria-label="blank"
										aria-hidden="false"
									/>
								) : (
									<span className="inline-block align-baseline mx-1">
										{base}
									</span>
								)

							return (
								<React.Fragment key={i}>
									{content}
									{punct && (
										<span className="inline-block align-baseline">{punct}</span>
									)}
									{i < currentSentenceObject.data.length - 1 && (
										<span className="inline"> </span>
									)}
								</React.Fragment>
							)
						})
					})()}
				</div>
				<div className="mt-3 flex items-center gap-2">
					<input
						type="text"
						className="px-2 py-1 border rounded min-w-[16ch]"
						placeholder={(() => {
							if (activeSectionOriginalIndex == null)
								return "All parts translated"
							const entry =
								currentSentenceObject?.data[activeSectionOriginalIndex]
							if (!entry) return "Translate"
							const count = spanishWordCount(entry)
							return count === 1
								? "Expect 1 Spanish word"
								: `Expect ${count} Spanish words`
						})()}
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						disabled={activeSectionOriginalIndex == null}
					/>
				</div>
			</div>
			<div className="mt-6">
				<details open>
					<summary className="cursor-pointer">Debug</summary>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<h4 className="font-semibold mb-1">Active</h4>
							<div className="text-sm">
								<div>Lesson: {currentLessonIndex + 1}</div>
								<div>Sentence #: {currentSentenceIndex + 1}</div>
								<div>Sentence: {currentSentenceObject?.sentence}</div>
								<div>
									Active Section Index: {activeSectionOriginalIndex ?? "-"}
								</div>
								{activeSectionOriginalIndex != null &&
									(() => {
										const entry =
											currentSentenceObject!.data[activeSectionOriginalIndex]
										const target = spanishTarget(entry) ?? ""
										const count = spanishWordCount(entry)
										const pt = formatPhraseTranslation(entry)
										return (
											<div className="mt-1">
												<div>Phrase: {entry.phrase}</div>
												{pt && <div>Phrase Translation (priority): {pt}</div>}
												<div>Target (Spanish): {target}</div>
												<div>Expected words: {count}</div>
											</div>
										)
									})()}
							</div>
						</div>
						<div>
							<h4 className="font-semibold mb-1">Progress</h4>
							<ul className="text-sm list-disc ml-5">
								{(currentSentenceProgress?.translationSections ?? []).map(
									(s) => {
										const entry = currentSentenceObject?.data[s.index]
										const pt = entry
											? formatPhraseTranslation(entry as SentenceDataEntry)
											: null
										return (
											<li key={s.index}>
												#{s.index + 1}: {entry?.phrase}
												{pt ? ` — ${pt}` : ""} -{" "}
												{s.isTranslated ? "translated" : "pending"}
											</li>
										)
									}
								)}
							</ul>
							<div className="text-sm mt-1">
								All translated:{" "}
								{(currentSentenceProgress?.translationSections ?? []).every(
									(s) => s.isTranslated
								)
									? "yes"
									: "no"}
							</div>
						</div>
					</div>
				</details>
			</div>
		</div>
	)
}

export default Main
