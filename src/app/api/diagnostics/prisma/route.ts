import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
	try {
		// Introspect delegate keys on prisma client instance
		const clientObj = prisma as unknown as Record<string, unknown>
		const keys = Object.keys(clientObj).filter(
			(k) => !k.startsWith("$") && typeof clientObj[k] === "object"
		)
		const modelKeys = keys.filter((k) => {
			const v = clientObj[k] as Record<string, unknown> | undefined
			if (!v) return false
			return ["findMany", "findFirst", "create", "count", "aggregate"].some(
				(m) => typeof v[m] === "function"
			)
		})
		// Try a lightweight count on a few known models (ignore failures)
		const sampleCounts: Record<string, number | string> = {}
		for (const mk of modelKeys.slice(0, 6)) {
			try {
				const delegate = clientObj[mk] as
					| { count?: () => Promise<number> }
					| undefined
				if (delegate && typeof delegate.count === "function") {
					sampleCounts[mk] = await delegate.count()
				}
			} catch {
				sampleCounts[mk] = "err"
			}
		}
		return NextResponse.json({ models: modelKeys, sampleCounts })
	} catch {
		return NextResponse.json({ error: "diagnostic failed" })
	}
}
