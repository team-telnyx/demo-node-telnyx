import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load database configuration with fallback system
 * Priority:
 * 1. database.json (contributor/local config - gitignored)
 * 2. database.sample.json (template for new users)
 */
export function loadDatabase() {
	const basePath = join(__dirname, "../");
	
	// Priority 1: Main database.json (for contributors)
	const mainDbPath = join(basePath, "database.json");
	if (existsSync(mainDbPath)) {
		console.log("📁 Loading database from: database.json");
		return JSON.parse(readFileSync(mainDbPath, "utf8"));
	}

	// Priority 2: Sample database (for new users)
	const sampleDbPath = join(basePath, "database.sample.json");
	if (existsSync(sampleDbPath)) {
		console.log("📁 Loading database from: database.sample.json");
		console.log("💡 Tip: Copy database.sample.json to database.json to customize your configuration");
		return JSON.parse(readFileSync(sampleDbPath, "utf8"));
	}

	// Fallback error
	throw new Error("❌ No database configuration found! Please ensure database.sample.json exists.");
}

/**
 * Get the active database file path for documentation
 */
export function getActiveDatabasePath() {
	const basePath = join(__dirname, "../");
	
	if (existsSync(join(basePath, "database.json"))) {
		return "database.json";
	}
	if (existsSync(join(basePath, "database.sample.json"))) {
		return "database.sample.json";
	}
	return null;
}