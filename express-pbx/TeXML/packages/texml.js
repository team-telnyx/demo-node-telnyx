import xmlFormat from "xml-formatter";

export const gatherTeXML = (gatherPrompt) =>
	xmlFormat(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather action="/gather" numDigits="1">
        <Say voice="alice">${gatherPrompt}</Say>
    </Gather>
   <Say>We did not receive any input. Goodbye!</Say>
</Response>`);

export const voicemailTeXML = (routeObject) => {
	const toExtension = routeObject.toExtension;
	console.log(`toExtension: ${toExtension}`);
	return xmlFormat(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
	<Say voice="alice">User at extension ${toExtension} is not available, please leave a message after the tone.</Say>
    
	<Record 
        beep="true" 
		action="/texml/voicemailFinished"
		recordingStatusCallback="/texml/voicemailFinished"
        recordingStatusCallbackMethod="POST"
        maxLength="300"
        timeout="5"
        transcribe="false"
        playBeep="true"
    />
</Response>`);
};

export const hangupTeXML = () =>
	xmlFormat(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Hangup/>
</Response>`);

export const transferPSTNOutbound = (routeObject) => {
	return xmlFormat(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial callerId="${routeObject.from}" action="/texml/dialFinished" method="POST">
        <Number>${routeObject.to}</Number>
    </Dial>
</Response>`);
};

export const transferExtension = (routeObject) => {
	const timeout = routeObject.timeout || "30";
	const fromDisplayName = routeObject.fromName || "Unknown";
	let fromSIPuser = `sip:${routeObject.from}@${process.env.SUBDOMAIN}.sip.telnyx.com`;
	const extensionNumber = routeObject.toExtension;
	const statusCallback = `statusCallback="${process.env.BASE_URL}/texml/callStatus" statusCallbackEvent="initiated ringing answered completed"`;

	// Variables that might change based on strategy

	let action = "/texml/dialFinished";
	let sipElements = "";
	// Sequential Dialing
	if (routeObject.strategy === "sequential") {
		console.log("sequential texml.js");
		console.log(routeObject.step);
		const step = routeObject.step || 1;
		const sipDestinations = Array.isArray(routeObject.to)
			? routeObject.to
			: [routeObject.to];
		const currentDestination = sipDestinations[step - 1];
		console.log(currentDestination);
		const nextStep = step + 1;
		const isLast = step === sipDestinations.length;

		if (
			currentDestination !== sipDestinations[sipDestinations.length - 1]
		) {
			action = `/texml/sequential?step=${nextStep}?ringGroup=${routeObject.toExtension}`;
			console.log(action);
			sipElements = `<Sip ${statusCallback}>${currentDestination}</Sip>`;
			console.log(action);
			console.log(sipElements);
		} else {
			sipElements = `<Sip ${statusCallback}>${currentDestination}</Sip>`;
		}
		// Simultaneous Dialing
	} else if (routeObject.strategy === "simultaneous") {
		// Handle simultaneous dialing
		const sipDestinations = Array.isArray(routeObject.to)
			? routeObject.to
			: [routeObject.to];
		sipElements = sipDestinations
			.map((destination) => `<Sip ${statusCallback}>${destination}</Sip>`)
			.join("\n");
	} else {
		// Single Extension Dialing
		fromSIPuser = routeObject.from;
		const sipDestinations = Array.isArray(routeObject.to)
			? routeObject.to[0]
			: routeObject.to;
		sipElements = `<Sip ${statusCallback}>${sipDestinations}</Sip>`;
	}
	console.log(action);

	return xmlFormat(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial answerOnBridge="true" timeout="${timeout}" fromDisplayName="${fromDisplayName}" callerId="${fromSIPuser}" action="${action}" method="POST">
        ${sipElements}
    </Dial>
</Response>`);
};
