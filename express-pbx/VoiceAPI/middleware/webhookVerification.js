import crypto from "crypto";
import config from "../config/config.js";

export const verifyWebhook = (req, res, next) => {
	// Skip verification in development if no public key is set
	if (!config.telnyx.publicKey) {
		console.warn("⚠️ Webhook verification skipped - no TELNYX_PUBLIC_KEY set");
		return next();
	}

	// Temporary: Skip verification while debugging
	console.warn("⚠️ Webhook verification temporarily disabled for debugging");
	return next();

	try {
		const signature = req.headers['telnyx-signature-ed25519'];
		const timestamp = req.headers['telnyx-timestamp'];
		
		if (!signature || !timestamp) {
			console.error("❌ Missing signature or timestamp headers");
			return res.status(401).json({ error: "Missing required headers" });
		}

		// Get raw body for signature verification
		const body = req.body.toString('utf8');
		const signedPayload = timestamp + '|' + body;
		
		// Parse JSON for route handlers
		req.body = JSON.parse(body);
		
		// Verify Ed25519 signature
		let isValid = false;
		
		try {
			// Try raw Ed25519 format first
			const publicKeyBuffer = Buffer.from(config.telnyx.publicKey, 'base64');
			const signatureBuffer = Buffer.from(signature, 'hex');
			const messageBuffer = Buffer.from(signedPayload, 'utf8');
			
			const publicKey = crypto.createPublicKey({
				key: publicKeyBuffer,
				format: 'raw',
				type: 'ed25519'
			});

			isValid = crypto.verify(
				null,
				messageBuffer,
				publicKey,
				signatureBuffer
			);
		} catch (keyError) {
			try {
				// Fallback: try with DER format
				const publicKeyBytes = Buffer.from(config.telnyx.publicKey, 'base64');
				const publicKey = crypto.createPublicKey({
					key: Buffer.concat([
						Buffer.from([0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00]),
						publicKeyBytes
					]),
					format: 'der',
					type: 'spki'
				});

				isValid = crypto.verify(
					null,
					Buffer.from(signedPayload, 'utf8'),
					publicKey,
					Buffer.from(signature, 'hex')
				);
			} catch (derError) {
				console.error("❌ Both key formats failed:", keyError.message, derError.message);
				isValid = false;
			}
		}

		if (!isValid) {
			console.error("❌ Invalid webhook signature");
			return res.status(401).json({ error: "Invalid signature" });
		}

		// Check timestamp freshness (within 5 minutes)
		const timestampMs = parseInt(timestamp) * 1000;
		const now = Date.now();
		const fiveMinutes = 5 * 60 * 1000;

		if (Math.abs(now - timestampMs) > fiveMinutes) {
			console.error("❌ Webhook timestamp too old");
			return res.status(401).json({ error: "Timestamp too old" });
		}

		console.log("✅ Webhook signature verified");
		next();
	} catch (error) {
		console.error("❌ Webhook verification error:", error);
		return res.status(401).json({ error: "Signature verification failed" });
	}
};

export const logWebhook = (req, res, next) => {
	// Parse JSON body if it's still raw (for development when verification is disabled)
	if (Buffer.isBuffer(req.body)) {
		try {
			req.body = JSON.parse(req.body.toString('utf8'));
		} catch (error) {
			console.error("❌ Failed to parse JSON body:", error);
			return res.status(400).json({ error: "Invalid JSON" });
		}
	}
	
	const eventType = req.body?.data?.event_type || 'unknown';
	const callId = req.body?.data?.payload?.call_control_id || 'unknown';
	
	console.log(`📡 Webhook received: ${eventType} for call ${callId}`);
	next();
};