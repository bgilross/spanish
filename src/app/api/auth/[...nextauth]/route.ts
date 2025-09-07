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
			authorization: {
				params: {
					prompt: "select_account",
					access_type: "offline",
					response_type: "code",
				},
			},
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
	events: {
		signIn(message: unknown) {
			const m = message as { user?: { id?: string } }
			console.log("[auth] signIn", m.user?.id)
		},
		signOut(message: unknown) {
			const m = message as { sessionToken?: string }
			console.log("[auth] signOut", m.sessionToken)
		},
		session(message: unknown) {
			const m = message as { session?: { user?: { id?: string } } }
			console.log("[auth] session", m.session?.user?.id)
		},
	},
	logger: {
		error(code: string, metadata?: unknown) {
			console.error("[auth][error]", code, metadata)
		},
		warn(code: string) {
			console.warn("[auth][warn]", code)
		},
		debug(code: string, metadata?: unknown) {
			console.debug("[auth][debug]", code, metadata)
		},
	},
} as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handler = NextAuth(authOptions as any)

export { handler as GET, handler as POST }
