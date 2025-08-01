import * as db from "../../utils/databaseUtils.js";
import config from "../config/config.js";

// Parse Extension Number from SIP URI
const extensionNumberFromSipUri = (sipUri) =>
	sipUri.split("@")[0].replace("sip:", "");

class RouteBuilder {
	constructor(event) {
		this.route = {
			callingPartyType: event.calling_party_type,
			destinationPartyType: event.to?.match(/^\+\d+$/) ? "pstn" : "sip",
			from: event.from,
			fromName: event.caller_id_name || "Unknown",
			to: event.to,
			toExtension: null,
			toName: null,
			timeout: null,
			strategy: null,
			step: null,
			voicemail: false,
			callId: event.call_control_id,
			connectionId: event.connection_id,
			clientState: event.client_state,
		};
	}

	setFromExtension(extensionDetails) {
		if (!extensionDetails) return this;

		// For SIP-to-SIP calls, format the from field as sip:extension@subdomain.sip.telnyx.com
		if (this.route.destinationPartyType === "sip") {
			this.route.from = `sip:${extensionDetails.extension}@${config.telnyx.subdomain}.sip.telnyx.com`;
		} else {
			// For PSTN calls, use the DID
			this.route.from = extensionDetails.did || this.route.from;
		}

		// Always set fromName to the extension's name if available
		// This ensures we use the proper display name for the calling extension
		if (extensionDetails.name) {
		
			this.route.fromName = extensionDetails.name;
		} else {
			console.log(
				"Extension has no name, keeping current fromName:",
				this.route.fromName
			);
		}
		return this;
	}

	setToExtension(extensionDetails) {
		if (!extensionDetails) return this;
		this.route.voicemail = extensionDetails.voicemail || false;
		this.route.to = extensionDetails.destination || this.route.to;
		this.route.toExtension = extensionDetails.extension;
		this.route.toName = extensionDetails.name || "Unknown";
		this.route.timeout = parseInt(extensionDetails.timeout) || 30;
		this.route.strategy = extensionDetails.ringStrategy || null;
		this.route.destinationPartyType = "sip";
		return this;
	}

	setRingGroupStrategy() {
		// Don't override strategy if it's already set by setToExtension
		if (!this.route.strategy) {
			this.route.strategy = "ringGroup";
		}
		return this;
	}

	setFallbackDestination(fallbackUri) {
		this.route.to = fallbackUri;
		this.route.strategy = null;
		return this;
	}

	build() {
		return this.route;
	}
}

export const handleRouting = (event) => {
	const routeBuilder = new RouteBuilder(event);
	const { calling_party_type: callingPartyType, from, to } = event;
	const callId = routeBuilder.route.callId;

	console.log(
		`📞 ${callingPartyType?.toUpperCase()} CALL | From: ${from} | To: ${to} | CallId: ${callId}`
	);

	if (callingPartyType === "sip") {
		return handleSipCall(routeBuilder, event);
	} else if (callingPartyType === "pstn") {
		return handlePstnCall(routeBuilder, event);
	} else {
		console.log(
			`📞 UNKNOWN CALL TYPE | From: ${from} | To: ${to} | CallId: ${callId}`
		);
		routeBuilder.setFallbackDestination(to);
		return logAndBuildRoute(routeBuilder);
	}
};

// Handle SIP-originated calls (extension to extension or extension to PSTN)
const handleSipCall = (routeBuilder, event) => {
	const fromExtensionNumber = extensionNumberFromSipUri(event.from);
	const toExtensionNumber = extensionNumberFromSipUri(event.to);

	const fromExtensionDetails =
		db.lookupExtensionByNumber(fromExtensionNumber);
	const toExtensionDetails = db.lookupExtensionByNumber(toExtensionNumber);

	// Always set from extension for SIP calls
	routeBuilder.setFromExtension(fromExtensionDetails);

	if (routeBuilder.route.destinationPartyType === "pstn") {
		// Extension to PSTN outbound call
		console.log(
			`📞 EXTENSION > PSTN OUTBOUND | From: ${routeBuilder.route.from} | To: ${event.to}`
		);
	} else {
		// Internal SIP call - handle based on destination type
		handleInternalSipCall(routeBuilder, toExtensionDetails, event.to);
	}

	return logAndBuildRoute(routeBuilder);
};

// Handle internal SIP to SIP calls
const handleInternalSipCall = (routeBuilder, toExtensionDetails, eventTo) => {
	if (!toExtensionDetails) {
		console.log("❌ No extension found for SIP number:", eventTo);
		routeBuilder.setFallbackDestination(eventTo);
		return;
	}

	routeBuilder.setToExtension(toExtensionDetails);
	// The from field is already set correctly by setFromExtension above
	const callType =
		toExtensionDetails.type === "ringGroup" ? "Ring Group" : "INTERNAL";
	const logMessage = `📞 SIP > SIP ${callType} | From: ${routeBuilder.route.fromName} | To: ${routeBuilder.route.toName}`;

	if (toExtensionDetails.type === "ringGroup") {
		console.log(`${logMessage} | Strategy: ${routeBuilder.route.strategy}`);
	} else {
		console.log(logMessage);
	}
};

// Handle PSTN-originated calls (inbound calls from external numbers)
const handlePstnCall = (routeBuilder, event) => {
	// Try inbound routing first, then direct extension lookup
	const targetExtension = findPstnTargetExtension(event.to);

	if (targetExtension) {
		// Set fromName from caller_id_name if available, then set extension
		if (event.caller_id_name)
			routeBuilder.route.fromName = event.caller_id_name;
		routeBuilder.setToExtension(targetExtension);
		console.log(
			`📞 PSTN INBOUND ROUTED | To Extension: ${routeBuilder.route.toExtension} | To Name: ${routeBuilder.route.toName}`
		);
	} else {
		console.log("❌ No extension found for PSTN number:", event.to);
		routeBuilder.setFallbackDestination(event.to);
	}

	// Ensure fromName is set from caller_id_name for PSTN calls (do this last to prevent overwriting)

	return logAndBuildRoute(routeBuilder);
};

// Find target extension for PSTN calls
const findPstnTargetExtension = (eventTo) => {
	// First try inbound routing lookup
	const inboundRoute = db.lookupInboundRouting(eventTo);
	if (inboundRoute) {
		const targetExtension = db.lookupExtensionByNumber(
			inboundRoute.extension
		);
		if (targetExtension) {
			return targetExtension;
		}
		console.log("❌ Target extension not found:", inboundRoute.extension);
	}

	// Fallback to direct extension lookup
	return db.lookupExtensionByNumber(eventTo);
};

// Log final route and build
const logAndBuildRoute = (routeBuilder) => {
	const finalRoute = routeBuilder.build();
	return finalRoute;
};
