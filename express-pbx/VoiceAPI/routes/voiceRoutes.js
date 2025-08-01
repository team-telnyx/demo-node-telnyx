import express from "express";
import { voiceController } from "../controllers/voiceController.js";
import { fromBase64 } from "../utils/base64.js";

const router = express.Router();

// Webhook endpoints for Telnyx Voice API events
router.post("/call.initiated", voiceController.handleInboundCall.bind(voiceController));
router.post("/call.answered", voiceController.handleCallAnswered.bind(voiceController));
router.post("/call.hangup", voiceController.handleCallHangup.bind(voiceController));
router.post("/call.dtmf.received", voiceController.handleGatherComplete.bind(voiceController));
router.post("/call.recording.saved", voiceController.handleRecordingComplete.bind(voiceController));
router.post("/call.speak.ended", voiceController.handleSpeakEvent.bind(voiceController));
router.post("/call.speak.started", voiceController.handleSpeakEvent.bind(voiceController));

// Generic webhook handler that routes events based on event_type
router.post("/webhook", async (req, res) => {
	try {
		const event = req.body;
		const eventType = event.data?.event_type;
		
		// Decode client_state if present
		let context = null;
		if (event.data?.payload?.client_state) {
			try {
				context = JSON.parse(fromBase64(event.data.payload.client_state));
				// console.log(`🔍 Client state decoded:`, context);
			} catch (error) {
				console.warn(`⚠️ Failed to decode client_state:`, error.message);
			}
		}
		
		// Attach context to request for controllers
		req.context = context;
		if (eventType != "call.cost") {
			// console.log(`📡 Received webhook: ${eventType}`, JSON.stringify(event, null, 2));
		}

		// Route events to appropriate handlers
		switch (eventType) {
			case 'call.initiated':
				await voiceController.handleInboundCall(req, res);
				break;
			case 'call.answered':
				await voiceController.handleCallAnswered(req, res);
				break;
			case 'call.hangup':
				await voiceController.handleCallHangup(req, res);
				break;
			case 'call.dtmf.received':
				await voiceController.handleGatherComplete(req, res);
				break;
			case 'call.recording.saved':
				await voiceController.handleRecordingComplete(req, res);
				break;
			case 'call.speak.ended':
			case 'call.speak.started':
				await voiceController.handleSpeakEvent(req, res);
				break;
			case 'call.cost':
				console.log(`💰 Call cost event: ${eventType}`);
				res.status(200).json({ status: "received" });
				break;
			default:
				console.log(`⚠️ Unhandled event type: ${eventType}`);
				res.status(200).json({ status: "received", message: `Unhandled event type: ${eventType}` });
		}
	} catch (error) {
		console.error("❌ Error handling webhook:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

// Health check endpoint
router.get("/health", (req, res) => {
	res.json({ 
		status: "healthy", 
		service: "voice-api-pbx",
		timestamp: new Date().toISOString()
	});
});

export default router;