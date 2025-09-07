import NextAuth from "next-auth/next"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"

// Using const assertions to satisfy NextAuth expected literal types
const authOptions = {
	adapter: PrismaAdapter(prisma),
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID || "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
		}),
	],
	session: { strategy: "database" as const },
	callbacks: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		async session({ session, user }: { session: any; user: { id: string } }) {
			if (session.user) {
				;(session.user as { id?: string }).id = user.id
			}
			return session
		},
	},
} as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handler = NextAuth(authOptions as any)

export { handler as GET, handler as POST }
