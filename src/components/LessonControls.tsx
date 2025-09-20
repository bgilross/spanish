"use client"

import React from "react"
import { useDataStore } from "@/data/dataStore"
// expectedAnswers no longer used here; simulation moved to helper
import { simulateLessonOnce } from "@/lib/simulate"

type Props = {
	onBeforeSimulate?: () => void
	showSimulator?: boolean
	compact?: boolean
	showImmediateToggle?: boolean
}

const LessonControls: React.FC<Props> = ({
	onBeforeSimulate,
	showSimulator = true,
	compact = false,
	showImmediateToggle = false,
}) => {
	const lessons = useDataStore((s) => s.lessons)
	const currentLessonIndex = useDataStore((s) => s.currentLessonIndex)
	const startNewLesson = useDataStore((s) => s.startNewLesson)
	// simulation helper reads store directly
	const immediateFeedbackMode = useDataStore((s) => s.immediateFeedbackMode)
	const toggleImmediateFeedbackMode = useDataStore(
		(s) => s.toggleImmediateFeedbackMode
	)

	const [simulating, setSimulating] = React.useState(false)
	const [isMobile, setIsMobile] = React.useState(false)

	React.useEffect(() => {
		if (typeof window === "undefined") return
		const check = () => setIsMobile(window.innerWidth < 640)
		check()
		window.addEventListener("resize", check)
		return () => window.removeEventListener("resize", check)
	}, [])

	const handleLessonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const index = parseInt(e.target.value)
		startNewLesson(index)
	}

	const simulateLesson = async () => {
		if (simulating) return
		onBeforeSimulate?.()
		setSimulating(true)
		try {
			await simulateLessonOnce()
		} finally {
			setSimulating(false)
		}
	}

	return (
		<div className="flex items-center gap-2 flex-wrap">
			<select
				value={currentLessonIndex}
				onChange={handleLessonChange}
				className={
					"border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-black text-white dark:bg-black dark:text-white max-w-full " +
					(compact
						? "px-2 py-1 text-[11px] sm:text-xs"
						: "px-2 py-1 text-xs sm:text-sm")
				}
				style={{ backgroundColor: "black", color: "white" }}
				aria-label="Select lesson"
			>
				{lessons.map((lesson, i) => {
					const rawDetail = lesson.details || lesson.name || ""
					const fullLabel = `Lesson ${lesson.lesson} - ${rawDetail}`
					let truncated = rawDetail.split(/\.\s|;|,|\n/)[0].trim()
					if (truncated.length > 28) truncated = truncated.slice(0, 28) + "…"
					const mobileLabel = `L${lesson.lesson}: ${truncated}`
					const display = compact && isMobile ? mobileLabel : fullLabel
					return (
						<option
							key={i}
							value={i}
							className="bg-black text-white"
							title={fullLabel}
						>
							{display}
						</option>
					)
				})}
			</select>
			{showSimulator && (
				<button
					onClick={simulateLesson}
					disabled={simulating}
					className={
						"px-2 py-1 border rounded disabled:opacity-50 whitespace-nowrap " +
						(compact ? "text-[11px]" : "text-xs")
					}
					title="Simulate one wrong and one right answer per section"
				>
					{simulating
						? "Simulating…"
						: compact
						? "Simulate"
						: "Simulate lesson (wrong+right)"}
				</button>
			)}
			{showImmediateToggle !== false && (
				<label
					className={
						"flex items-center gap-1 cursor-pointer select-none " +
						(compact ? "text-[11px]" : "text-xs")
					}
					title={"enable instant feedback on every incorrect input"}
				>
					<input
						type="checkbox"
						checked={immediateFeedbackMode}
						onChange={toggleImmediateFeedbackMode}
						className="accent-emerald-600"
						aria-label={"enable instant feedback on every incorrect input"}
					/>
					<span title={"enable instant feedback on every incorrect input"}>
						Immediate feedback
					</span>
				</label>
			)}
		</div>
	)
}

export default LessonControls
