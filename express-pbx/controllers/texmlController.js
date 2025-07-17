import express from "express";
import * as db from "../models/db.js";
import * as texml from "../packages/texml.js";
import xmlFormat from "xml-formatter";
import { handleRouting } from "../packages/routing.js";

const router = express.Router();

// Initial inbound call
router.route("/inbound").post(async (req, res) => {
	try {
		const event = req.body;
		console.log(event);
		// determine if the call is from the pstn or sip - event.CallingPartyType = PSTN or SIP

		const routeObject = handleRouting(event, null);
		//console.log(routeObject);
		if (routeObject.strategy === null) {
			console.log("ring strategy is null");
			if (routeObject.destinationPartyType === "pstn") {
				res.send(texml.transferPSTNOutbound(routeObject));
			} else {
				console.log("transferSingleExtension");
				res.send(texml.transferExtension(routeObject));
			}
		} else if (routeObject.strategy === "simultaneous") {
			res.send(texml.transferExtension(routeObject));
		} else if (routeObject.strategy === "sequential") {
			// set step to 1
			routeObject.step = 1;
			res.send(texml.transferExtension(routeObject));
		} else {
			console.log(`routeObject.strategy: ${routeObject.strategy}`);
			console.error("No Routes Found");
			res.send(texml.hangupTeXML());
		}
	} catch (error) {
		console.error(error);
		console.log(`routeObject.strategy: ${routeObject.strategy}`);
		console.error("Invalid strategy");
	}
});

router.route("/gather").post(async (req, res) => {
	const transferGreeting = "Thank you, connecting you now";
	const event = req.body;
	const digits = parseInt(event.Digits);
	console.log(
		`🔢 GATHER | Digits: ${digits} | From: ${event.From} | To: ${event.To} | CallSid: ${event.CallSid}`
	);

	res.type("application/xml");
	switch (digits) {
		case 1:
			break;
		case 2:
			break;
		default:
			break;
	}
});

router.route("/voicemailFinished").post(async (req, res) => {
	const event = req.body;
	console.log(
		`🎙️ RECORD FINISHED | From: ${event.From} | To: ${
			event.To
		} | CallSid: ${event.CallSid} | RecordingUrl: ${
			event.RecordingUrl || "N/A"
		}`
	);
	res.type("application/xml");
	res.send(texml.hangupTeXML());
});

router.route("/recordStatus").post(async (req, res) => {
	const event = req.body;
	console.log(
		`📊 RECORD STATUS | CallSid: ${event.CallSid} | Status: ${
			event.RecordingStatus || "N/A"
		}`
	);
	res.sendStatus(200);
});

router.route("/sequential").post(async (req, res) => {
	const event = req.body;
	const dialCallStatus = event.DialCallStatus;
	console.log("sequential");
	console.log(event);
	const step = parseInt(req.query.step) || 1;
	const toModified = event.ToSipUri;
	console.log(toModified);
	const fromModified = event.CallerId;

	console.log(
		`🔄 SEQUENTIAL STEP ${step} | CallSid: ${
			event.CallSid
		} | DialCallStatus: ${dialCallStatus || "N/A"}`
	);

	if (dialCallStatus === "answered") {
		console.log(`Call answered at step ${step - 1}`);
		// Log successful connection, update database, etc.
		res.status(200).send("");
		return;
	} else {
		console.log(
			`Step ${step - 1} failed: ${dialCallStatus} initiate  step${step}`
		);
		// const toExtension = destinationFromSipUri(ringGroup);
		event.To = toModified;
		event.From = fromModified;
		const routeObject = handleRouting(event);
		routeObject.step = step;
		console.log(routeObject);
		console.log(routeObject.step);
		res.type("application/xml");
		res.send(texml.transferExtension(routeObject));
		return;
	}

	res.status(200).send("");
});

router.route("/dialFinished").post(async (req, res) => {
	const event = req.body;
	console.log(event);
	const toModified = event.ToSipUri;
	event.To = toModified;
	const routeObject = handleRouting(event);

	console.log(
		`📞 DIAL FINISHED | CallSid: ${event.CallSid} | DialCallStatus: ${
			event.DialCallStatus || "N/A"
		}`
	);
	if (routeObject.voicemail) {
		console.log("voicemail");
		res.type("application/xml");
		res.send(texml.voicemailTeXML(routeObject));
	} else {
		console.log("hangup");
		res.type("application/xml");
		res.send(texml.hangupTeXML());
	}
});

router.route("/callStatus").post(async (req, res) => {
	const event = req.body;
	console.log(
		`📞 CALL STATUS | CallSid: ${event.CallSid} | CallStatus: ${
			event.CallStatus || "N/A"
		}`
	);
	res.status(200).send("");
});

export default router;
