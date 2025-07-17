import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const database = JSON.parse(
	readFileSync(join(__dirname, "./database.json"), "utf8")
);

// Parse Extension Number from SIP URI
const extensionNumberFromSipUri = (sipUri) => sipUri.split("@")[0];

// Parse PSTN number from event
const parsePstnNumber = (eventTo) => eventTo.match(/^\+1\d{10}$/);

export const lookupUserByPhoneNumber = (eventTo) => {
	// Parse PSTN number from event
	const pstnNumber = parsePstnNumber(eventTo);

	if (pstnNumber) {
		// Handle PSTN number lookup
		const extension = database.extensions.find(
			(ext) => ext.did === eventTo
		);
		if (!extension) {
			return {
				sip: [],
				pstn: [],
				voicemailUrl: null,
			};
		}

		// Convert destination to sip array format expected by the application
		const sip = Array.isArray(extension.destination)
			? extension.destination
			: [extension.destination];

		// For now, pstn is empty since we're using SIP destinations
		const pstn = [];

		// Voicemail URL - you might want to construct this based on your setup
		const voicemailUrl = extension.voicemail
			? `/voicemail/${extension.extension}`
			: null;

		return {
			sip,
			pstn,
			voicemailUrl,
		};
	} else {
		// Handle SIP URI lookup
		const extension = extensionNumberFromSipUri(eventTo);
		const extensionRecord = database.extensions.find(
			(ext) => ext.extension === extension
		);

		if (!extensionRecord) {
			return {
				sip: [],
				pstn: [],
				voicemailUrl: null,
			};
		}

		// Convert destination to sip array format expected by the application
		const sip = Array.isArray(extensionRecord.destination)
			? extensionRecord.destination
			: [extensionRecord.destination];

		// For now, pstn is empty since we're using SIP destinations
		const pstn = [];

		// Voicemail URL - you might want to construct this based on your setup
		const voicemailUrl = extensionRecord.voicemail
			? `/voicemail/${extensionRecord.extension}`
			: null;

		return {
			sip,
			pstn,
			voicemailUrl,
		};
	}
};

export const lookupExtensionByNumber = (eventTo) => {
	// Parse PSTN number from event
	const pstnNumber = parsePstnNumber(eventTo);

	if (pstnNumber) {
		// Handle PSTN number lookup
		const extension = database.extensions.find(
			(ext) => ext.did === eventTo
		);
		if (!extension) {
			return null;
		}

		// Return the extension with properly formatted destination
		return {
			...extension,
			destination: Array.isArray(extension.destination)
				? extension.destination
				: [extension.destination],
		};
	} else {
		// Handle SIP URI lookup
		const extension = extensionNumberFromSipUri(eventTo);
		const extensionRecord = database.extensions.find(
			(ext) => ext.extension === extension
		);

		if (!extensionRecord) {
			return null;
		}

		// Return the extension with properly formatted destination
		return {
			...extensionRecord,
			destination: Array.isArray(extensionRecord.destination)
				? extensionRecord.destination
				: [extensionRecord.destination],
		};
	}
};
