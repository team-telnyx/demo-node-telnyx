import { telnyxService } from "../services/telnyxService.js";
import { handleRouting } from "../models/routing.js";
import {
	updateContext,
	getNextDestination,
	removeFirstDestination,
	hasMoreDestinations,
} from "../models/contextManager.js";
import { CallStrategyService } from "../services/callStrategyService.js";

export class VoiceController {
	constructor() {
		this.callStrategyService = new CallStrategyService(this);
	}

	// Handle incoming call webhooks
	async handleInboundCall(req, res) {
		try {
			const event = req.body;
			const context = req.context;
			// console.log("📞 Inbound call webhook:", JSON.stringify(event));

			const payload = event.data.payload;
			const callId = payload.call_control_id;

			// Only handle parked calls (new incoming calls from PSTN/SIP)
			// If there's already a context, this is a dial call we created, so ignore it
			if (payload.state !== "parked" || context !== null) {
				console.log(
					`⚠️ Call is parked or has context, ignoring: ${callId}`,
					{ state: payload.state, hasContext: !!context }
				);
				res.status(200).json({ status: "ignored" });
				return;
			}

			// Extract Voice API event parameters
			const routingParams = {
				from: payload.from,
				to: payload.to,
				calling_party_type: payload.calling_party_type,
				caller_id_name: payload.caller_id_name,
				client_state: payload.client_state,
				call_control_id: callId,
				connection_id: payload.connection_id,
			};

			
			// Determine routing
			const routeObject = handleRouting(routingParams);
			console.log("🎯 Route Object:", routeObject);

			// Use CallStrategyService to handle routing strategies
			await this.callStrategyService.executeStrategy(callId, routeObject);

			res.status(200).json({ status: "processed" });
		} catch (error) {
			console.error("❌ Error handling inbound call:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}

	// Handle call answered events
	async handleCallAnswered(req, res) {
		try {
			const event = req.body;
			const context = req.context;
			const callId = event.data.payload.call_control_id;
			console.log(`✅ Call answered: ${callId}`);

			if (context) {
				// Handle different states based on context
				if (context.currentState === "voicemail") {
					// Start voicemail flow
					await this.startVoicemailGreeting(callId, context);
				}
				// For ext2ext, sequential, and pstn-outbound calls, no additional action needed
				// The calls are already linked via linkTo parameter in createCall
			}

			res.status(200).json({ status: "processed" });
		} catch (error) {
			console.error("❌ Error handling call answered:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}

	// Handle call hangup events
	async handleCallHangup(req, res) {
		try {
			const event = req.body;
			const context = req.context;
			const callId = event.data.payload.call_control_id;
			const hangupCause = event.data.payload.hangup_cause;
			const sipHangupCause = event.data.payload.sip_hangup_cause;

			console.log(`📞 Call hung up: ${callId}, cause: ${hangupCause}, sip_hangup_cause: ${sipHangupCause}`);

			// Determine the effective hangup cause for routing decisions
			const effectiveHangupCause = this.determineEffectiveHangupCause(hangupCause, sipHangupCause);

			// Only process calls that have context (related to routing)
			if (!context) {
				res.status(200).json({ status: "processed" });
				return;
			}

			// Route to appropriate handler based on hangup cause
			if (effectiveHangupCause === 'originator_cancel') {
				await this.handleOriginatorCancel(context);
			} else if (this.isCallFailure(effectiveHangupCause)) {
				await this.handleCallFailure(context, effectiveHangupCause);
			}

			res.status(200).json({ status: "processed" });
		} catch (error) {
			console.error("❌ Error handling call hangup:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}

	// Determine the effective hangup cause, handling special cases like do not disturb
	determineEffectiveHangupCause(hangupCause, sipHangupCause) {
		// Handle do not disturb scenario - SIP 480 with normal clearing should be treated as busy
		if (sipHangupCause === "480" && hangupCause === "normal_clearing") {
			console.log(`📵 Device do not disturb detected (SIP 480) - treating as user_busy`);
			return "user_busy";
		}
		
		return hangupCause;
	}

	// Check if hangup cause indicates a call failure that should trigger retry/voicemail
	isCallFailure(hangupCause) {
		return ['timeout', 'destination_unavailable', 'user_busy'].includes(hangupCause);
	}

	// Handle originator cancel (caller hung up)
	async handleOriginatorCancel(context) {
		console.log(`🔌 Originator cancel - hung up related call: ${context.relatedCalls[0]}`);
		// Additional cleanup logic could go here if needed
	}

	// Handle call failure scenarios (timeout, busy, unavailable)
	async handleCallFailure(context, hangupCause) {
		// For sequential routing, try next destination if available
		if (context.currentState === 'sequential' && hasMoreDestinations(context)) {
			console.log(`🔄 Sequential routing - trying next destination after ${hangupCause}`);
			await this.handleSequentialNextDestination(context);
		} else {
			console.log(`📧 No more destinations - proceeding to voicemail after ${hangupCause}`);
			await this.handleTimeoutOrBusy(context, hangupCause);
		}
	}

	// Handle DTMF digit gathering
	async handleGatherComplete(req, res) {
		try {
			const event = req.body;
			const callId = event.data.payload.call_control_id;
			const digits = event.data.payload.digits;

			console.log(`🔢 DTMF gathered: ${digits} from call ${callId}`);

			// Process gathered digits based on application logic
			await this.processDtmfDigits(callId, digits);

			res.status(200).json({ status: "processed" });
		} catch (error) {
			console.error("❌ Error handling DTMF gather:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}

	// Handle recording completion
	async handleRecordingComplete(req, res) {
		try {
			const event = req.body;
			const callId = event.data.payload.call_control_id;
			const recordingUrl = event.data.payload.recording_urls?.mp3;

			console.log(
				`🎙️ Recording complete for call ${callId}: ${recordingUrl}`
			);

			// Process voicemail recording
			if (recordingUrl) {
				// Here you would typically save the recording URL to database
				// and potentially send notifications
				console.log(`💾 Voicemail saved: ${recordingUrl}`);
			}

			

			res.status(200).json({ status: "processed" });
		} catch (error) {
			console.error("❌ Error handling recording complete:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}


	// Transfer to PSTN destination
	async transferToPstn(callId, routeObject) {
		try {
			await telnyxService.transferToPstn(callId, routeObject.to, {
				from: routeObject.from,
				fromDisplayName: routeObject.fromName,
				timeout: routeObject.timeout,
			});
		} catch (error) {
			console.error("❌ Error transferring to PSTN:", error);
			throw error;
		}
	}

	// Handle simultaneous ringing (ring all destinations at once)
	async handleSimultaneousRinging(callId, routeObject, context) {
		try {
			const destinations = Array.isArray(routeObject.to)
				? routeObject.to
				: [routeObject.to];

			await telnyxService.dialMultiple(
				callId,
				destinations,
				"simultaneous",
				{
					from: routeObject.from,
					fromDisplayName: routeObject.fromName,
					timeout: routeObject.timeout,
					clientState: context,
				}
			);
		} catch (error) {
			console.error("❌ Error handling simultaneous ringing:", error);
			throw error;
		}
	}

	// Handle sequential ringing (try destinations one by one)
	async handleSequentialRinging(callId, routeObject, context) {
		try {
			const destinations = Array.isArray(routeObject.to)
				? routeObject.to
				: [routeObject.to];
			const firstDestination = destinations[0];

			// Remove first destination from context before dialing
			const updatedContext = removeFirstDestination(context);

			// Start with first destination - use createCall instead of forkCall
			await telnyxService.createCall(firstDestination, routeObject.from, {
				fromDisplayName: routeObject.fromName,
				timeout: routeObject.timeout,
				clientState: updatedContext,
				linkTo: callId,
			});
		} catch (error) {
			console.error("❌ Error handling sequential ringing:", error);
			throw error;
		}
	}


	// Handle voicemail
	async handleVoicemail(callId, routeObject) {
		try {
			console.log(
				`🎙️ Starting voicemail for extension ${routeObject.toExtension}`
			);

			// Speak voicemail greeting
			await telnyxService.speak(
				callId,
				`User at extension ${routeObject.toExtension} is not available, please leave a message after the tone.`
			);

			// Start recording
			await telnyxService.startRecording(callId, {
				format: "mp3",
				channels: "single",
			});
		} catch (error) {
			console.error("❌ Error handling voicemail:", error);
			throw error;
		}
	}

	// Process DTMF digits
	async processDtmfDigits(callId, digits) {
		try {
			console.log(`Processing DTMF: ${digits} for call ${callId}`);

			// Implement digit processing logic based on your needs
			switch (digits) {
				case "1":
					// Handle option 1
					await telnyxService.speak(callId, "You pressed 1");
					break;
				case "2":
					// Handle option 2
					await telnyxService.speak(callId, "You pressed 2");
					break;
				default:
					await telnyxService.speak(
						callId,
						"Invalid option. Please try again."
					);
					break;
			}
		} catch (error) {
			console.error("❌ Error processing DTMF digits:", error);
			throw error;
		}
	}

	// Create dial call with context management
	async createDialCall(originalCallId, routeObject, context) {
		try {
			const destination = Array.isArray(routeObject.to)
				? routeObject.to[0]
				: routeObject.to;

			const callOptions = {
				fromDisplayName: routeObject.fromName,
				timeout: routeObject.timeout || 30,
				clientState: context,
				linkTo: originalCallId,
			};

			await telnyxService.createCall(
				destination,
				routeObject.from,
				callOptions
			);

			// Update context with new call info
			await telnyxService.updateClientState(
				originalCallId,
				updateContext(context, { relatedCalls: [originalCallId] })
			);

			console.log(
				`📞 Created dial call from ${originalCallId} to ${destination}`
			);
		} catch (error) {
			console.error("❌ Error creating dial call:", error);
			throw error;
		}
	}

	// Handle sequential ring group next destination
	async handleSequentialNextDestination(context) {
		try {
			const nextDestination = getNextDestination(context);

			if (nextDestination) {
				console.log(`📞 Sequential next destination: ${nextDestination}`);
				
				// Remove current destination from remaining destinations
				const updatedContext = removeFirstDestination(context);
				
				// Create call to next destination using route info
				const routeInfo = context.routeInfo || {};
				await telnyxService.createCall(nextDestination, routeInfo.from, {
					fromDisplayName: routeInfo.fromName,
					timeout: routeInfo.timeout || 30,
					clientState: updatedContext,
					linkTo: context.relatedCalls[0],
				});
			} else {
				console.log("📞 No more destinations in sequential ring group");
			}
		} catch (error) {
			console.error("❌ Error handling sequential next destination:", error);
			throw error;
		}
	}


	// Handle timeout or busy - determine next step based on context
	async handleTimeoutOrBusy(context, hangupCause) {
		try {
			console.log(`📞 Handling timeout/busy: ${hangupCause}`);

			// Check if there are remaining destinations
			if (hasMoreDestinations(context)) {
				// For simultaneous ringing, just log - the sequential logic is handled elsewhere
				if (context.currentState === 'simultaneous') {
					console.log("📞 Simultaneous ringing - other destinations may still be ringing");
					return;
				}
			}

			// No more destinations - proceed with voicemail
			console.log("📞 No more destinations available, starting voicemail process");
			
			const voicemailContext = updateContext(context, {
				currentState: "voicemail",
			});
			
			// Answer the original call and start voicemail
			await telnyxService.answerCall(
				context.relatedCalls[0],
				voicemailContext
			);
			
			
			
		} catch (error) {
			console.error("❌ Error handling timeout/busy:", error);
			throw error;
		}
	}

	// Start voicemail greeting
	async startVoicemailGreeting(callId, context) {
		try {
			const greeting =
				"Hello, you have reached my voicemail box. I am unable to take your call right now, please leave a message after the tone.";

			await telnyxService.speak(callId, greeting, {
				service_level: "premium",
				voice: "AWS.Polly.Joanna",
				language: "en-US",
				clientState: context,
			});

			console.log(`🗣️ Started voicemail greeting for call: ${callId}`);
		} catch (error) {
			console.error("❌ Error starting voicemail greeting:", error);
			throw error;
		}
	}

	// Handle speak events (started and ended)
	async handleSpeakEvent(req, res) {
		try {
			const event = req.body;
			const context = req.context;
			const callId = event.data.payload.call_control_id;
			const eventType = event.data.event_type;
			const payloadStatus = event.data.payload.status;

			// Check if caller hung up during voicemail operation
			if (payloadStatus === "call_hangup") {
				console.log(`🔌 Originator cancel before voicemail operation could complete: ${callId}`);
				res.status(200).json({ status: "processed" });
				return;
			}

			if (eventType === "call.speak.started") {
				console.log(`🗣️ Speak started for call: ${callId}`);
			} else if (eventType === "call.speak.ended") {
				console.log(`🗣️ Speak ended for call: ${callId}`);
				
				if (context && context.currentState === "voicemail") {
					// Start recording after greeting ends
					await telnyxService.startRecording(callId, {
						format: "mp3",
						channels: "single",
						play_beep: true,
					});
					console.log(
						`🎙️ Started voicemail recording for call: ${callId}`
					);
				}
			}

			res.status(200).json({ status: "processed" });
		} catch (error) {
			console.error("❌ Error handling speak event:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}
}

export const voiceController = new VoiceController();
