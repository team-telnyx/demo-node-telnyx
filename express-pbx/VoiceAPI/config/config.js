import { config as dotenvConfig } from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Load .env from parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenvConfig({ path: join(__dirname, "../../.env") });

const config = {
	// Server configuration
	port: process.env.PORT || 3000,
	
	// Telnyx configuration
	telnyx: {
		apiKey: process.env.TELNYX_API_KEY,
		publicKey: process.env.TELNYX_PUBLIC_KEY,
		connectionId: process.env.TELNYX_VOICEAPI_CONNECTION_ID,
		subdomain: process.env.SUBDOMAIN,
		baseUrl: process.env.BASE_URL,
	},

	// Call configuration
	call: {
		defaultTimeout: 30,
		recordingFormat: 'mp3',
		voice: 'alice',
		language: 'en-US'
	},

	// Voicemail configuration
	voicemail: {
		maxLength: 300, // 5 minutes
		timeout: 5,
		format: 'mp3'
	},

	// Ring group configuration
	ringGroup: {
		simultaneousTimeout: 30,
		sequentialStepTimeout: 15
	},

	// DTMF configuration
	dtmf: {
		timeout: 5000,
		maxDigits: 10,
		terminatingDigit: '#'
	}
};

// Validate required environment variables
const requiredEnvVars = [
	'TELNYX_API_KEY',
	'TELNYX_PUBLIC_KEY',
	'TELNYX_VOICEAPI_CONNECTION_ID'
];

for (const envVar of requiredEnvVars) {
	if (!process.env[envVar]) {
		console.error(`❌ Missing required environment variable: ${envVar}`);
		process.exit(1);
	}
}

export default config;