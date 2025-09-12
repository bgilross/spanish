"use client"
import React from "react"
import type { TopicNode } from "@/lib/quiz/types"

export interface TopicTreeProps {
	nodes: TopicNode[]
	selected: Set<string>
	onToggle: (id: string, subtree: TopicNode | null) => void
	collapsed?: Record<string, boolean>
	onCollapseChange?: (id: string, collapsed: boolean) => void
}

const TopicTree: React.FC<TopicTreeProps> = ({
	nodes,
	selected,
	onToggle,
	collapsed = {},
	onCollapseChange,
}) => {
	return (
		<ul className="space-y-1">
			{nodes.map((n) => (
				<li
					key={n.id}
					className="border border-zinc-700/40 rounded p-2 bg-zinc-900/40"
				>
					<div className="flex items-center gap-2">
						{n.children && n.children.length > 0 && (
							<button
								type="button"
								onClick={() =>
									onCollapseChange && onCollapseChange(n.id, !collapsed[n.id])
								}
								className="text-xs px-1 rounded bg-zinc-800 hover:bg-zinc-700"
							>
								{collapsed[n.id] ? "+" : "-"}
							</button>
						)}
						<label className="flex items-center gap-2 text-sm cursor-pointer select-none">
							<input
								type="checkbox"
								checked={selected.has(n.id)}
								onChange={() => onToggle(n.id, n)}
								className="accent-emerald-600"
							/>
							<span>{n.label}</span>
						</label>
					</div>
					{n.info && n.info.length > 0 && (
						<div className="mt-1 text-[10px] text-zinc-400 leading-snug line-clamp-3">
							{n.info[0]}
						</div>
					)}
					{!collapsed[n.id] && n.children && n.children.length > 0 && (
						<div className="pl-5 mt-2">
							<TopicTree
								nodes={n.children}
								selected={selected}
								onToggle={onToggle}
								collapsed={collapsed}
								onCollapseChange={onCollapseChange}
							/>
						</div>
					)}
				</li>
			))}
		</ul>
	)
}

export default TopicTree
