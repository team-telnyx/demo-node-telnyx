import * as db from "../../utils/databaseUtils.js";

// Parse Extension Number from SIP URI
const extensionNumberFromSipUri = (sipUri) => sipUri.split("@")[0];



class RouteBuilder {
	constructor(event) {
		this.route = {
			callingPartyType: event.CallingPartyType,
			destinationPartyType: event.To.match(/^\+1\d{10}$/) ? "pstn" : "sip",
			from: event.From,
			fromName: event.CallerId?.replace(/,/g, " ").trim(),
			to: event.To,
			toExtension: null,
			toName: null,
			timeout: null,
			strategy: null,
			step: null,
			voicemail: false,
			CallSid: event.CallSid,
		};
	}

	setFromExtension(extensionDetails) {
		if (!extensionDetails) return this;
		
		this.route.from = extensionDetails.did || this.route.from;
		if (this.route.fromName === extensionDetails.extension) {
			console.log("Setting fromName", extensionDetails.name);
			this.route.fromName = extensionDetails.name || "Unknown";
		} else {
			console.log("Not setting fromName", this.route.fromName);
		}
		return this;
	}

	setToExtension(extensionDetails) {
		if (!extensionDetails) return this;
		this.route.voicemail = extensionDetails.voicemail || false;
		this.route.to = extensionDetails.destination || this.route.to;
		this.route.toExtension = extensionDetails.extension;
		this.route.toName = extensionDetails.name || "Unknown";
		this.route.timeout = extensionDetails.timeout || "30";
		this.route.strategy = extensionDetails.ringStrategy || null;
		this.route.destinationPartyType = "sip";
		return this;
	}

	setRingGroupStrategy() {
		this.route.strategy = "ringGroup";
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

	if (event.CallingPartyType === "sip") {
		console.log(`📞 SIP CALL | From: ${event.From} | To: ${event.To} | CallSid: ${event.CallSid}`);

		const fromExtensionNumber = extensionNumberFromSipUri(event.From);
		const toExtensionNumber = extensionNumberFromSipUri(event.To);

		const fromExtensionDetails = db.lookupExtensionByNumber(fromExtensionNumber);
		const toExtensionDetails = db.lookupExtensionByNumber(toExtensionNumber);

		//console.log("📋 From Extension Details:", fromExtensionDetails);
		//console.log("📋 To Extension Details:", toExtensionDetails);

		if (routeBuilder.route.destinationPartyType === "pstn") {
			// Extension to PSTN outbound call
			routeBuilder.setFromExtension(fromExtensionDetails);
			console.log(`📞 EXTENSION > PSTN OUTBOUND | From: ${routeBuilder.route.from} | To: ${event.To}`);
		} else if (toExtensionDetails?.type === "extension") {
			// SIP to SIP call (internal extension call)
			

			routeBuilder
				.setFromExtension(fromExtensionDetails)
				.setToExtension(toExtensionDetails);

			console.log(`📞 SIP > SIP INTERNAL | From: ${routeBuilder.route.fromName} | To: ${routeBuilder.route.toName} | RouteObject:`, routeBuilder.route);
		} else if (toExtensionDetails?.type === "ringGroup") {
			
			
			routeBuilder
			.setFromExtension(fromExtensionDetails)
			.setRingGroupStrategy()
			.setToExtension(toExtensionDetails)
			
			console.log(`📞 SIP > SIP Ring Group | From: ${routeBuilder.route.fromName} | To: ${routeBuilder.route.toName} | RouteObject:`, routeBuilder.route);
		} else {
			console.log("❌ No extension found for SIP number:", event.To);
			routeBuilder.setFallbackDestination(event.ToSipUri);
		}
	} else if (event.CallingPartyType === "pstn") {
		console.log(`📞 PSTN INBOUND | From: ${event.From} | To: ${event.To} | CallSid: ${event.CallSid}`);

		const toExtensionDetails = db.lookupExtensionByNumber(event.To);

		if (toExtensionDetails) {
			routeBuilder.setToExtension(toExtensionDetails);
			console.log(`📞 PSTN INBOUND ROUTED | To Extension: ${routeBuilder.route.toExtension} | To Name: ${routeBuilder.route.toName} | RouteObject:`, routeBuilder.route);
		} else {
			console.log("❌ No extension found for PSTN number:", event.To);
			routeBuilder.setFallbackDestination(event.ToSipUri);
		}
	} else {
		console.log(`📞 UNKNOWN CALL TYPE | From: ${event.From} | To: ${event.To} | CallSid: ${event.CallSid}`);
	}

	const finalRoute = routeBuilder.build();
	console.log("📋 Final Route Object:", JSON.stringify(finalRoute, null, 2));
	return finalRoute;
};
