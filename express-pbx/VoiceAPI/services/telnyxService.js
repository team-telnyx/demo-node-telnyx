import telnyx from "telnyx";
import axios from "axios";
import config from "../config/config.js";
import { toBase64, fromBase64 } from "../utils/base64.js";

// Initialize Telnyx with API key from config (updated SDK style)
const telnyxClient = telnyx(config.telnyx.apiKey);

// Configure axios for Telnyx API
const telnyxAxios = axios.create({
	baseURL: "https://api.telnyx.com/v2",
	headers: {
		Authorization: `Bearer ${config.telnyx.apiKey}`,
		"Content-Type": "application/json",
	},
});

export class TelnyxVoiceService {
	// Answer an incoming call with optional client_state
	// BUG: Telnyx SDK has bugs with answer method as of 31JUL2025 - using axios until fix is released
	async answerCall(callId, clientState = null) {
		try {
		
			
			const requestBody = {};
			if (clientState) {
				requestBody.client_state = toBase64(JSON.stringify(clientState));
			}
			
			// Using axios due to Telnyx SDK bug - will revert to SDK after fix
			const response = await telnyxAxios.post(`/calls/${callId}/actions/answer`, requestBody);
			console.log(`📞 Call answered via axios: ${callId}`);
			return response.data;
		} catch (error) {
			console.error(`❌ Error answering call ${callId} via axios:`, error);
			if (error.response && error.response.data && error.response.data.errors) {
				console.error(
					"Raw errors:",
					JSON.stringify(error.response.data.errors, null, 2)
				);
			}
			if (error.response && error.response.status) {
				console.error(`HTTP status: ${error.response.status}`);
			}
			throw error;
		}
	}

	

	// BUG: Telnyx SDK has bugs with hangup method as of 31JUL2025 - using axios until fix is released
	async hangupCall(callId) {
		try {
			// Using axios due to Telnyx SDK bug - will revert to SDK after fix
			const response = await telnyxAxios.post(`/calls/${callId}/actions/hangup`, {});
			console.log(`📞 Call hung up via axios: ${callId}`);
			return response.data;
		} catch (error) {
			console.error(`❌ Error hanging up call ${callId} via axios:`, error);
			if (error.response && error.response.data && error.response.data.errors) {
				console.error(
					"Raw errors:",
					JSON.stringify(error.response.data.errors, null, 2)
				);
			}
			if (error.response && error.response.status) {
				console.error(`HTTP status: ${error.response.status}`);
			}
			throw error;
		}
	}

	// Transfer call to SIP destination
	// BUG: Telnyx SDK has bugs with transfer method as of 31JUL2025 - using axios until fix is released
	async transferToSip(callId, sipUri, options = {}) {
		try {
			const transferOptions = {
				to: sipUri,
				from: options.from || process.env.TELNYX_NUMBER,
				from_display_name: options.fromDisplayName,
				timeout_secs: options.timeout || 30,
				answering_machine_detection: "disabled",
				...options,
			};

			// Add client_state if provided
			if (options.clientState) {
				transferOptions.client_state = toBase64(
					JSON.stringify(options.clientState)
				);
			}

			// Using axios due to Telnyx SDK bug - will revert to SDK after fix
			const response = await telnyxAxios.post(`/calls/${callId}/actions/transfer`, transferOptions);
			console.log(`📞 Call transferred to SIP via axios: ${callId} -> ${sipUri}`);
			return response.data;
		} catch (error) {
			console.error(
				`❌ Error transferring call ${callId} to ${sipUri}:`,
				error
			);
			if (error.response && error.response.data && error.response.data.errors) {
				console.error(
					"Raw errors:",
					JSON.stringify(error.response.data.errors, null, 2)
				);
			}
			if (error.response && error.response.status) {
				console.error(`HTTP status: ${error.response.status}`);
			}
			throw error;
		}
	}

	// Transfer call to PSTN number
	async transferToPstn(callId, phoneNumber, options = {}) {
		try {
			const transferOptions = {
				to: phoneNumber,
				from: options.from || process.env.TELNYX_NUMBER,
				from_display_name: options.fromDisplayName,
				timeout_secs: options.timeout || 30,
				answering_machine_detection: "disabled",
				...options,
			};

			// Add client_state if provided
			if (options.clientState) {
				transferOptions.client_state = toBase64(
					JSON.stringify(options.clientState)
				);
			}

			const response = await telnyxClient.calls.transfer(
				callId,
				transferOptions
			);
			console.log(
				`📞 Call transferred to PSTN: ${callId} -> ${phoneNumber}`
			);
			return response;
		} catch (error) {
			console.error(`❌ Error transferring call ${callId} to ${phoneNumber}:`, error);
			if (error.response && error.response.data && error.response.data.errors) {
				console.error(
					"Raw errors:",
					JSON.stringify(error.response.data.errors, null, 2)
				);
			}
			if (error.response && error.response.status) {
				console.error(`HTTP status: ${error.response.status}`);
			}
			throw error;
		}
	}
	// Bridge two calls
	async bridgeCalls(callId1, callId2) {
		try {
			// Use the bridge action with proper options object
			// The bridge method expects an options object with call_control_id
			const response = await telnyxClient.calls.bridge(callId1, {
				call_control_id: callId2,
			});
			console.log(`🌉 Bridged calls: ${callId1} <-> ${callId2}`);
			return response;
		} catch (error) {
			console.error(
				`❌ Error bridging calls ${callId1} and ${callId2}:`,
				error
			);
			if (error.response && error.response.data && error.response.data.errors) {
				console.error(
					"Raw errors:",
					JSON.stringify(error.response.data.errors, null, 2)
				);
			}
			if (error.response && error.response.status) {
				console.error(`HTTP status: ${error.response.status}`);
			}
			throw error;
		}
	}

	// Create a new outbound call with client_state and answer_on_bridge
	async createCall(to, from, options = {}) {
		try {
			
			const callOptions = {
				to,
				from,
				connection_id: config.telnyx.connectionId,
				from_display_name: options.fromDisplayName,
				timeout_secs: options.timeout || 30,
				bridge_on_answer: true,
				link_to: options.linkTo,
			};

			// Add client_state if provided
			if (options.clientState) {
				console.log("Adding client_state");
				callOptions.client_state = toBase64(
					JSON.stringify(options.clientState)
				);
				
			}

			

			// Use Telnyx SDK
			const response = await telnyxClient.calls.create(callOptions);
			console.log(`📞 Outbound call created: ${to}`);
			return response;
		} catch (error) {
			console.error(`❌ Error creating call to ${to}:`, error);
			if (error.response && error.response.data && error.response.data.errors) {
				console.error(
					"Raw errors:",
					JSON.stringify(error.response.data.errors, null, 2)
				);
			}
			if (error.response && error.response.status) {
				console.error(`HTTP status: ${error.response.status}`);
			}
			throw error;
		}
	}

	// Dial multiple destinations (for ring groups) - now uses createCall instead of fork
	async dialMultiple(
		callId,
		destinations,
		strategy = "simultaneous",
		options = {}
	) {
		try {
			const promises = [];

			if (strategy === "simultaneous") {
				// Create calls to all destinations at once
				for (const destination of destinations) {
					const callOptions = {
						...options,
						linkTo: callId,
						clientState: options.clientState,
					};
					const promise = this.createCall(
						destination,
						options.from,
						callOptions
					);
					promises.push(promise);
				}
				const results = await Promise.allSettled(promises);
				return results;
			} else if (strategy === "sequential") {
				// Create calls to destinations one by one
				return await this.dialSequential(callId, destinations, options);
			}
		} catch (error) {
			console.error(`❌ Error dialing multiple destinations:`, error);
			throw error;
		}
	}

	// Sequential dialing - create calls to destinations one by one
	async dialSequential(callId, destinations, options = {}) {
		for (let i = 0; i < destinations.length; i++) {
			try {
				const destination = destinations[i];
				console.log(`📞 Sequential dial step ${i + 1}: ${destination}`);

				const callOptions = {
					...options,
					linkTo: callId,
					timeout: options.stepTimeout || 15,
					clientState: options.clientState,
				};

				const result = await this.createCall(
					destination,
					options.from,
					callOptions
				);

				// Return after first successful attempt
				return result;
			} catch (error) {
				console.error(
					`❌ Sequential dial step ${i + 1} failed:`,
					error
				);
				if (error.response && error.response.data && error.response.data.errors) {
					console.error(
						"Raw errors:",
						JSON.stringify(error.response.data.errors, null, 2)
					);
				}
				if (error.response && error.response.status) {
					console.error(`HTTP status: ${error.response.status}`);
				}
				if (i === destinations.length - 1) {
					throw error; // Last attempt failed
				}
			}
		}
	}

	// Gather DTMF digits
	async gatherDigits(callId, options = {}) {
		try {
			const gatherOptions = {
				min: options.minDigits || 1,
				max: options.maxDigits || 1,
				timeout_millis: options.timeout || 5000,
				terminating_digit: options.terminatingDigit || "#",
				payload: options.prompt || "Please enter a digit",
				voice: options.voice || "alice",
				...options,
			};

			// Add client_state if provided
			if (options.clientState) {
				gatherOptions.client_state = toBase64(
					JSON.stringify(options.clientState)
				);
			}

			const response = await telnyxClient.calls.gatherUsingSpeak(
				callId,
				gatherOptions
			);

			console.log(`🔢 Gathering digits from call ${callId}`);
			return response;
		} catch (error) {
			console.error(
				`❌ Error gathering digits from call ${callId}:`,
				error
			);
			if (error.response && error.response.data && error.response.data.errors) {
				console.error(
					"Raw errors:",
					JSON.stringify(error.response.data.errors, null, 2)
				);
			}
			if (error.response && error.response.status) {
				console.error(`HTTP status: ${error.response.status}`);
			}
			throw error;
		}
	}

	// Start recording
	// BUG: Telnyx SDK has bugs with record method as of 31JUL2025 - using axios until fix is released
	async startRecording(callId, options = {}) {
		try {
			const requestBody = {
				format: options.format || "mp3",
				channels: options.channels || "single",
				play_beep: options.play_beep || true,
				...options,
			};

			// Using axios due to Telnyx SDK bug - will revert to SDK after fix
			const response = await telnyxAxios.post(`/calls/${callId}/actions/record_start`, requestBody);
			console.log(`🎙️ Recording started via axios for call ${callId}`);
			return response.data;
		} catch (error) {
			console.error(
				`❌ Error starting recording for call ${callId} via axios:`,
				error
			);
			if (error.response && error.response.data && error.response.data.errors) {
				console.error(
					"Raw errors:",
					JSON.stringify(error.response.data.errors, null, 2)
				);
			}
			if (error.response && error.response.status) {
				console.error(`HTTP status: ${error.response.status}`);
			}
			throw error;
		}
	}

	// Stop recording
	// BUG: Telnyx SDK has bugs with record method as of 31JUL2025 - using axios until fix is released
	async stopRecording(callId) {
		try {
			// Using axios due to Telnyx SDK bug - will revert to SDK after fix
			const response = await telnyxAxios.post(`/calls/${callId}/actions/record_stop`, {});
			console.log(`🎙️ Recording stopped via axios for call ${callId}`);
			return response.data;
		} catch (error) {
			console.error(
				`❌ Error stopping recording for call ${callId} via axios:`,
				error
			);
			if (error.response && error.response.data && error.response.data.errors) {
				console.error(
					"Raw errors:",
					JSON.stringify(error.response.data.errors, null, 2)
				);
			}
			if (error.response && error.response.status) {
				console.error(`HTTP status: ${error.response.status}`);
			}
			throw error;
		}
	}

	// Update client state for a call
	async updateClientState(callId, clientState) {
		try {
			const response = await telnyxClient.calls.updateClientState(
				callId,
				{
					client_state: toBase64(JSON.stringify(clientState)),
				}
			);
			console.log(`🔄 Updated client state for call: ${callId}`);
			return response;
		} catch (error) {
			console.error(
				`❌ Error updating client state for call ${callId}:`,
				error
			);
			if (error.response && error.response.data && error.response.data.errors) {
				console.error(
					"Raw errors:",
					JSON.stringify(error.response.data.errors, null, 2)
				);
			}
			if (error.response && error.response.status) {
				console.error(`HTTP status: ${error.response.status}`);
			}
			throw error;
		}
	}

	// Speak with client_state
	// BUG: Telnyx SDK has bugs with speak method as of 31JUL2025 - using axios until fix is released
	async speak(callId, text, options = {}) {
		try {
			const requestBody = {
				payload: text,
				voice: options.voice || "alice",
				language: options.language || "en-US",
				...options,
			};

			// Add client_state if provided
			if (options.clientState) {
				requestBody.client_state = toBase64(
					JSON.stringify(options.clientState)
				);
			}

			// Using axios due to Telnyx SDK bug - will revert to SDK after fix
			const response = await telnyxAxios.post(`/calls/${callId}/actions/speak`, requestBody);
			console.log(`🗣️ Speaking to call via axios ${callId}: "${text}"`);
			return response.data;
		} catch (error) {
			console.error(`❌ Error speaking to call ${callId} via axios:`, error);
			if (error.response && error.response.data && error.response.data.errors) {
				console.error(
					"Raw errors:",
					JSON.stringify(error.response.data.errors, null, 2)
				);
			}
			if (error.response && error.response.status) {
				console.error(`HTTP status: ${error.response.status}`);
			}
			throw error;
		}
	}

	// Speak using axios instead of Telnyx SDK
	async speakAxios(callId, text, options = {}) {
		try {
			const requestBody = {
				payload: text,
				voice: options.voice || "alice",
				language: options.language || "en-US",
				...options,
			};

			// Add client_state if provided
			if (options.clientState) {
				requestBody.client_state = toBase64(
					JSON.stringify(options.clientState)
				);
			}

			const response = await telnyxAxios.post(`/calls/${callId}/actions/speak`, requestBody);
			console.log(`🗣️ Speaking to call via axios ${callId}: "${text}"`);
			return response.data;
		} catch (error) {
			console.error(`❌ Error speaking to call ${callId} via axios:`, error);
			if (error.response && error.response.data && error.response.data.errors) {
				console.error(
					"Raw errors:",
					JSON.stringify(error.response.data.errors, null, 2)
				);
			}
			if (error.response && error.response.status) {
				console.error(`HTTP status: ${error.response.status}`);
			}
			throw error;
		}
	}
}

// Create singleton instance
export const telnyxService = new TelnyxVoiceService();
