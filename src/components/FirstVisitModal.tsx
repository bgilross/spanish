"use client"
import React, { useEffect, useState, useCallback } from "react"

const points: string[] = [
	"This is a Spanish learning/quiz app focused on SYNTAX, not vocabulary.",
	"Log in through Google to save and track your progress.",
	"Click 'Lesson Info' for information on the current lesson.",
	"Open 'Word Bank' for a summary of the Spanish words covered in this lesson.",
	"Make sure to read Lessons 1 and 2 for introductory information on the course method.",
]

export const FirstVisitModal: React.FC = () => {
	const [open, setOpen] = useState(true)
	const dismiss = useCallback(() => setOpen(false), [])

	useEffect(() => {
		if (!open) return
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") dismiss()
		}
		window.addEventListener("keydown", onKey)
		return () => window.removeEventListener("keydown", onKey)
	}, [open, dismiss])

	if (!open) return null

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label="Site information"
			style={{
				position: "fixed",
				inset: 0,
				background: "rgba(0,0,0,.55)",
				display: "flex",
				justifyContent: "center",
				alignItems: "flex-start",
				paddingTop: "10vh",
				zIndex: 9999,
			}}
			onClick={dismiss}
		>
			<div
				style={{
					background: "#ffffff",
					color: "#1f2937",
					width: "min(640px,92%)",
					maxHeight: "75vh",
					overflowY: "auto",
					borderRadius: 12,
					padding: "1.75rem 2rem",
					boxShadow: "0 8px 32px rgba(0,0,0,.25)",
					position: "relative",
					fontFamily:
						"system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif",
				}}
				onClick={(e) => e.stopPropagation()}
			>
				<button
					aria-label="Close"
					onClick={dismiss}
					style={{
						position: "absolute",
						top: 8,
						right: 8,
						border: "none",
						background: "transparent",
						fontSize: "1.35rem",
						lineHeight: 1,
						cursor: "pointer",
					}}
				>
					×
				</button>
				<h2 style={{ margin: "0 0 .5rem" }}>Welcome / Bienvenido</h2>
				<p style={{ marginTop: 0, marginBottom: "1rem" }}>
					Quick notes before you start:
				</p>
				<ul style={{ lineHeight: 1.4, paddingLeft: "1.1rem", margin: 0 }}>
					{points.map((p) => (
						<li
							key={p}
							style={{ marginBottom: ".55rem" }}
						>
							{p}
						</li>
					))}
				</ul>
				<div style={{ display: "flex", gap: ".75rem", marginTop: "1.25rem" }}>
					<button
						onClick={dismiss}
						style={{
							background: "#2563eb",
							color: "#fff",
							border: "none",
							padding: ".65rem 1.25rem",
							borderRadius: 6,
							fontWeight: 600,
							cursor: "pointer",
						}}
					>
						Close
					</button>
				</div>
			</div>
		</div>
	)
}

export default FirstVisitModal
