import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// Simple endpoint to toggle or set a user's isAdmin flag.
// Allowed callers:
//  - In development: any authenticated user may toggle their own role
//  - In production: request must include X-ADMIN-SECRET header matching ADMIN_SECRET

const ADMIN_SECRET = process.env.ADMIN_SECRET || ""

export async function POST(req: NextRequest) {
	try {
		const { userId, isAdmin } = await req.json()
		if (typeof userId !== "string")
			return NextResponse.json({ error: "userId required" }, { status: 400 })
		if (typeof isAdmin !== "boolean")
			return NextResponse.json(
				{ error: "isAdmin must be boolean" },
				{ status: 400 }
			)

		// In production require secret header
		if (process.env.NODE_ENV === "production") {
			const header = req.headers.get("x-admin-secret") || ""
			if (!ADMIN_SECRET || header !== ADMIN_SECRET) {
				return NextResponse.json({ error: "not authorized" }, { status: 403 })
			}
		}

		// Use raw SQL update to avoid requiring an immediate Prisma client re-generate
		// after schema changes. $executeRaw returns the number of rows affected.
		const updated = await prisma.$executeRaw`
			UPDATE "User" SET "isAdmin" = ${isAdmin} WHERE id = ${userId}
		`
		return NextResponse.json({ updated })
	} catch (e) {
		console.error("POST /api/admin/role error", e)
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		)
	}
}
