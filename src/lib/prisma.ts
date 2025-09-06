// NOTE: The Prisma client output directory is set to ../generated/prisma relative to prisma/schema.prisma,
// which resolves at project root /generated/prisma. We import via root-relative (tsconfig baseUrl = .)
// using the generated client's entrypoint (index.js / index.d.ts).
import { PrismaClient } from "generated/prisma"

// Ensure the PrismaClient is reused between hot reloads in dev.
// (globalThis as any) typing fallback to avoid TS complaints without changing tsconfig.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
	})

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma
