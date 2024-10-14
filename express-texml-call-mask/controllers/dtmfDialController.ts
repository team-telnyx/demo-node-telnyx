import express from "express";
import * as db from "../models/db";
import twilio from "twilio";
import Telnyx from "telnyx";
import * as texml from "../packages/texml";

const router = express.Router();
const VoiceResponse = twilio.twiml.VoiceResponse;

const hangupSentence = "Thank you for the call, hanging up";

router.route("/inbound").post(async (req, res) => {
  const defaultGatherSentence =
    "Hello, please enter the phone number with country code you would like to dial followed by the pound sign";
  const event = req.body as Telnyx.events.CallAnsweredEvent;
  console.log(event);
  const response = new VoiceResponse();
  const gather = response.gather({
    action: "gather",
    method: "POST",
    numDigits: 10,
    finishOnKey: "#",
  });
  gather.say(defaultGatherSentence);
  response.say(hangupSentence);
  response.hangup();
  res.type("application/xml");
  res.send(response.toString());
});

router.route("/gather").post(async (req, res) => {
  const event = req.body as Telnyx.events.CallGatherEndedEvent;
  console.log(event);
  const phoneNumber = event.data?.payload?.digits;
  const userRecord = db.lookupUserByPSTNPhoneNumber(event.data?.payload?.from!);

  // Connect inbound caller to conf
  // Create outbound dial to desired PSTN number
  // when that call answers, add to conf
  // save conf-id
  // every {duration} play audio to conf-id

  const response = new VoiceResponse();
  response.dial(
    {
      callerId: `${userRecord?.telnyxPhoneNumber}`,
      record: "record-from-answer-dual",
      recordingStatusCallback: "recordStatus",
      action: "dialFinished",
      method: "POST",
    },
    `+${phoneNumber}`
  );
  res.type("application/xml");
  res.send(response.toString());
});

router.route("/recordFinished").post(async (req, res) => {
  const event = req.body as Telnyx.events.CallRecordingSavedEvent;
  console.log(event);
  res.type("application/xml");
  res.send(texml.hangupTeXML(hangupSentence));
});

router.route("/recordStatus").post(async (req, res) => {
  const event = req.body as Telnyx.events.CallRecordingSavedEvent;
  console.log(event);
  res.sendStatus(200);
});

router.route("/dialFinished").post(async (req, res) => {
  const event = req.body;
  console.log(event);
  res.sendStatus(200);
});

export default router;
