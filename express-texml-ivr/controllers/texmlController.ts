import express from "express";
import Telnyx from "telnyx";
import * as db from "../models/db";
import * as texml from "../packages/texml";

const router = express.Router();

const hangupSentence = "Thank you for the call, hanging up";

type TelnyxTexmlTranslatorGatherCallback = {
  AccountSid: string;
  CallSid: string;
  CallSidLegacy: string;
  Digits: string;
  From: string;
  To: string;
};

router
  .route("/inbound")
  .post<{}, unknown, Telnyx.events.CallEvent>(async (req, res) => {
    const defaultGatherSentence =
      "Hello, please press 1 to connect to sales or 2 to leave a voicemail";
    const event = req.body;
    console.log(event);

    res.type("application/xml");
    res.send(texml.gatherTeXML(defaultGatherSentence));
  });

router
  .route("/gather")
  .post<{}, unknown, TelnyxTexmlTranslatorGatherCallback>(async (req, res) => {
    const transferGreeting = "Thank you, connecting you now";
    const event = req.body;
    console.log(event);
    const digits = parseInt(event.Digits);
    const userRecord = db.lookupUserByPhoneNumber(event.To);
    res.type("application/xml");
    switch (digits) {
      case 1:
        res.send(
          texml.transferTeXML(transferGreeting, userRecord.sip, userRecord.pstn)
        );
        break;
      case 2:
        res.send(texml.recordTeXML(userRecord.voicemailUrl));
        break;
      default:
        res.send(texml.hangupTeXML(hangupSentence));
        break;
    }
  });

router.route("/recordFinished").post(async (req, res) => {
  console.log(req.body);
  const event = req.body;
  res.type("application/xml");
  res.send(texml.hangupTeXML(hangupSentence));
});

router.route("/recordStatus").post(async (req, res) => {
  console.log(req.body);
  const event = req.body;
  res.sendStatus(200);
});

router.route("/dialFinished").post(async (req, res) => {
  console.log(req.body);
  const event = req.body;
  res.type("application/xml");
  res.send(texml.hangupTeXML(hangupSentence));
});

export default router;
