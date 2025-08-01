import { telnyxService } from "./telnyxService.js";
import { createContext } from "../models/contextManager.js";
import { determineContextType, processDestinations } from "../config/strategyConfig.js";

export class CallStrategyService {
	constructor(voiceController) {
		this.voiceController = voiceController;
	}

	async executeStrategy(callId, routeObject) {
		const strategy = routeObject.strategy;
		const contextType = determineContextType(
			routeObject.callingPartyType,
			routeObject.destinationPartyType,
			strategy
		);

		console.log(`📞 Context type determined: ${contextType} (calling: ${routeObject.callingPartyType}, destination: ${routeObject.destinationPartyType})`);

		switch (strategy) {
			case null:
				return this.handleDirectRouting(callId, routeObject, contextType);
			case "simultaneous":
				return this.handleSimultaneousStrategy(callId, routeObject, contextType);
			case "sequential":
				return this.handleSequentialStrategy(callId, routeObject, contextType);
			default:
				return this.handleUnknownStrategy(callId, strategy);
		}
	}

	async handleDirectRouting(callId, routeObject, contextType) {
		console.log("Ring strategy is null - direct routing");
		const context = createContext(contextType, [callId]);
		await this.voiceController.createDialCall(callId, routeObject, context);
	}

	async handleSimultaneousStrategy(callId, routeObject, contextType) {
		console.log("Handling simultaneous ring group");
		const destinations = processDestinations(routeObject.to);
		const context = createContext(contextType, [callId], destinations);
		await this.voiceController.handleSimultaneousRinging(callId, routeObject, context);
	}

	async handleSequentialStrategy(callId, routeObject, contextType) {
		console.log("Handling sequential ring group");
		const destinations = processDestinations(routeObject.to);
		const context = createContext(
			contextType,
			[callId],
			destinations,
			1,
			destinations.length,
			{
				from: routeObject.from,
				fromName: routeObject.fromName,
				timeout: routeObject.timeout
			}
		);
		await this.voiceController.handleSequentialRinging(callId, routeObject, context);
	}

	async handleUnknownStrategy(callId, strategy) {
		console.error("No valid routing strategy found, strategy:", strategy);
		await telnyxService.hangupCall(callId);
	}
}

export const callStrategyService = new CallStrategyService();