import type { NextConfig } from "next"
import pkg from "./package.json" assert { type: "json" }

const nextConfig: NextConfig = {
	/* config options here */
	env: {
		NEXT_PUBLIC_APP_VERSION:
			process.env.NEXT_PUBLIC_APP_VERSION ||
			(pkg as { version?: string }).version,
		BUILD_TIME: new Date().toISOString(),
	},
}

export default nextConfig
