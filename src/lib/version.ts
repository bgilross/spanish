// Auto-generated build/version metadata helper.
// Priority order:
// 1. Explicit env NEXT_PUBLIC_APP_VERSION (allows CI override)
// 2. package.json version field (at build time)
// 3. Fallback "0.0.0-dev"

// Importing package.json statically (tree-shaken to version string by Next build)
import pkgJson from "../../package.json" assert { type: "json" }
const pkg: { version?: string } = pkgJson as { version?: string }

export const APP_VERSION: string =
	process.env.NEXT_PUBLIC_APP_VERSION || pkg.version || "0.0.0-dev"

export const BUILD_TIME = process.env.BUILD_TIME || new Date().toISOString()

export const VERSION_META = {
	version: APP_VERSION,
	buildTime: BUILD_TIME,
}
