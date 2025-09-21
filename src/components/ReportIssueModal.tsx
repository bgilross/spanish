"use client"

import React from "react"
import { useSession } from "next-auth/react"
import type { Sentence } from "@/data/types"

type Props = {
	open: boolean
	onClose: () => void
	lesson?: { lesson: number }
	sentence?: Sentence | undefined
	userId?: string | null
	// When true, this is a general site feedback report (not tied to a lesson)
	general?: boolean
	// When true, hide the checkbox options (for contextual reports inside other UIs)
	hideCheckboxes?: boolean
	// When true, hide the sentence id line (used when reporting on lesson info text)
	hideSentence?: boolean
	// Context indicating source of report: 'general' | 'lessonInfo' | 'sentence'
	reportContext?: "general" | "lessonInfo" | "sentence"
}

const ReportIssueModal: React.FC<Props> = ({
	open,
	onClose,
	lesson,
	sentence,
	userId,
	general,
	hideCheckboxes,
	hideSentence,
	reportContext,
}) => {
	const { data: session } = useSession()
	const [reportSaving, setReportSaving] = React.useState(false)
	const [reportForm, setReportForm] = React.useState({
		reporterName: "",
		typo: false,
		missingReference: false,
		incorrectReference: false,
		wrongTranslation: false,
		wrongGender: false,
		other: false,
		notes: "",
	})

	React.useEffect(() => {
		if (!open) return
		setReportForm({
			reporterName: "",
			typo: false,
			missingReference: false,
			incorrectReference: false,
			wrongTranslation: false,
			wrongGender: false,
			other: false,
			notes: "",
		})
	}, [open])

	const submitReport = async () => {
		// For general feedback, use lessonNumber 0. Otherwise require lesson.
		if (!general && !lesson) return
		setReportSaving(true)
		try {
			const inferredName =
				reportForm.reporterName ||
				session?.user?.name ||
				session?.user?.email ||
				undefined
			const payload = {
				userId: typeof userId === "string" ? userId : undefined,
				reporterName: inferredName,
				lessonNumber: general ? 0 : lesson!.lesson,
				// For general feedback we won't include sentenceId
				sentenceId: general
					? undefined
					: typeof sentence?.id === "number"
					? sentence.id
					: undefined,
				typo: !!reportForm.typo,
				missingReference: !!reportForm.missingReference,
				incorrectReference: !!reportForm.incorrectReference,
				wrongTranslation: !!reportForm.wrongTranslation,
				other: !!reportForm.other,
				notes: reportForm.notes || undefined,
				wrongGender: !!reportForm.wrongGender,
				reportContext: reportContext || (general ? "general" : "sentence"),
			}
			const res = await fetch("/api/issues", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			})
			if (!res.ok) {
				const txt = await res.text().catch(() => "")
				throw new Error(`Request failed ${res.status}: ${txt}`)
			}
			await res.json()
			onClose()
			alert("Report submitted — thanks!")
		} catch (e) {
			console.error("Report save failed", e)
			alert("Failed to submit report")
		} finally {
			setReportSaving(false)
		}
	}

	if (!open) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div
				className="absolute inset-0 bg-black/50"
				onClick={onClose}
			/>
			<div className="relative w-[92%] max-w-2xl bg-zinc-900 text-zinc-100 border border-zinc-700 rounded-xl shadow-2xl p-5">
				<div className="flex items-start justify-between mb-3">
					<div>
						<h3 className="text-lg font-semibold">
							{general ? "Send feedback" : "Report issue"}
						</h3>
						{!general && lesson && (
							<div className="text-xs text-zinc-400 mt-1">
								Reporting on: Lesson {lesson.lesson}
								{!hideSentence && sentence
									? ` — sentence id ${sentence.id}`
									: ""}
							</div>
						)}
					</div>
					<button
						className="px-2 py-1 text-sm border rounded"
						onClick={onClose}
					>
						Close
					</button>
				</div>
				<div className="space-y-3">
					<div>
						<label className="text-xs text-zinc-400">
							Your name (optional)
						</label>
						<input
							className="w-full mt-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded"
							value={reportForm.reporterName}
							onChange={(e) =>
								setReportForm((s) => ({ ...s, reporterName: e.target.value }))
							}
						/>
					</div>
					{!hideCheckboxes && (
						<div className="grid grid-cols-2 gap-2">
							<label className="text-sm">
								<input
									type="checkbox"
									checked={reportForm.typo}
									onChange={(e) =>
										setReportForm((s) => ({ ...s, typo: e.target.checked }))
									}
								/>{" "}
								Typo
							</label>
							<label className="text-sm">
								<input
									type="checkbox"
									checked={reportForm.missingReference}
									onChange={(e) =>
										setReportForm((s) => ({
											...s,
											missingReference: e.target.checked,
										}))
									}
								/>{" "}
								Missing reference
							</label>
							<label className="text-sm">
								<input
									type="checkbox"
									checked={reportForm.incorrectReference}
									onChange={(e) =>
										setReportForm((s) => ({
											...s,
											incorrectReference: e.target.checked,
										}))
									}
								/>{" "}
								Incorrect reference
							</label>
							<label className="text-sm">
								<input
									type="checkbox"
									checked={reportForm.wrongTranslation}
									onChange={(e) =>
										setReportForm((s) => ({
											...s,
											wrongTranslation: e.target.checked,
										}))
									}
								/>{" "}
								Wrong translation
							</label>
							<label className="text-sm">
								<input
									type="checkbox"
									checked={reportForm.wrongGender}
									onChange={(e) =>
										setReportForm((s) => ({
											...s,
											wrongGender: e.target.checked,
										}))
									}
								/>{" "}
								Wrong gender
							</label>
							<label className="text-sm">
								<input
									type="checkbox"
									checked={reportForm.other}
									onChange={(e) =>
										setReportForm((s) => ({ ...s, other: e.target.checked }))
									}
								/>{" "}
								Other
							</label>
						</div>
					)}
					<div>
						<label className="text-xs text-zinc-400">Notes</label>
						<textarea
							className="w-full mt-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded"
							value={reportForm.notes}
							onChange={(e) =>
								setReportForm((s) => ({ ...s, notes: e.target.value }))
							}
						/>
					</div>
					<div className="flex items-center justify-end gap-2">
						<button
							className="px-3 py-1.5 text-sm rounded border"
							onClick={onClose}
						>
							Cancel
						</button>
						<button
							className="px-3 py-1.5 text-sm rounded bg-emerald-600 text-black font-medium"
							onClick={submitReport}
							disabled={reportSaving}
						>
							{reportSaving
								? "Submitting…"
								: general
								? "Send feedback"
								: "Submit report"}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

export default ReportIssueModal
