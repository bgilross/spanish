"use client"

import React from "react"

type Props = {
	text: string
	position?: "top" | "bottom"
	children: React.ReactNode
}

export default function Tooltip({ text, position = "top", children }: Props) {
	const [visible, setVisible] = React.useState(false)
	const reactId = React.useId()
	const idRef = React.useRef(`tooltip-${String(reactId).replace(/[:]/g, "-")}`)

	return (
		<span
			className="relative inline-block"
			onMouseEnter={() => setVisible(true)}
			onMouseLeave={() => setVisible(false)}
			onFocus={() => setVisible(true)}
			onBlur={() => setVisible(false)}
		>
			{React.Children.only(children)}
			<div
				id={idRef.current}
				role="tooltip"
				aria-hidden={!visible}
				className={
					"pointer-events-none absolute z-50 px-4 py-2 rounded text-sm bg-zinc-900 text-zinc-200 shadow-lg transition-opacity duration-150 whitespace-nowrap max-w-[36rem] overflow-ellipsis " +
					(visible ? "opacity-100" : "opacity-0") +
					(position === "top"
						? " bottom-full mb-2 left-1/2 -translate-x-1/2"
						: " top-full mt-2 left-1/2 -translate-x-1/2")
				}
			>
				{text}
			</div>
		</span>
	)
}
