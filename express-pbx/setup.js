#!/usr/bin/env node

import { existsSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("🚀 Express PBX Setup");
console.log("===================");

// Check for database.json
const databasePath = join(__dirname, "database.json");
const samplePath = join(__dirname, "database.sample.json");
const envPath = join(__dirname, ".env");
const envSamplePath = join(__dirname, ".env.sample");

let setupComplete = true;

// Setup database
if (!existsSync(databasePath)) {
	if (existsSync(samplePath)) {
		copyFileSync(samplePath, databasePath);
		console.log("✅ Created database.json from database.sample.json");
	} else {
		console.log("❌ database.sample.json not found!");
		setupComplete = false;
	}
} else {
	console.log("✅ database.json already exists");
}

// Setup environment
if (!existsSync(envPath)) {
	if (existsSync(envSamplePath)) {
		copyFileSync(envSamplePath, envPath);
		console.log("✅ Created .env from .env.sample");
		console.log("⚠️  Please edit .env with your Telnyx credentials");
		setupComplete = false; // User needs to configure
	} else {
		console.log("❌ .env.sample not found!");
		setupComplete = false;
	}
} else {
	console.log("✅ .env already exists");
}

console.log("");
if (setupComplete) {
	console.log("🎉 Setup complete! You can now run:");
	console.log("   npm run switch  # Configure Telnyx connections");
	console.log("   npm run texml   # Start TeXML application");  
	console.log("   npm run voiceapi # Start Voice API application");
} else {
	console.log("⚙️  Setup incomplete. Please:");
	console.log("   1. Configure your .env file with Telnyx credentials");
	console.log("   2. Customize database.json with your extensions");
	console.log("   3. Run 'npm run switch' to configure connections");
}
console.log("");