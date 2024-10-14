import express from "express";
import Telnyx from "telnyx";
import * as db from "../models/db";
import * as texml from "../packages/texml";

const router = express.Router();

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
    const gatherSentence =
      "Hello, please enter the phone number with country code you would like to dial followed by the pound sign";
    const event = req.body;
    console.log(event);

    res.type("application/xml");
    res.send(texml.gatherTeXML(gatherSentence, "#", 10, 15));
  });

router
  .route("/gather")
  .post<{}, unknown, TelnyxTexmlTranslatorGatherCallback>(async (req, res) => {
    const event = req.body;
    console.log(event);
    const phoneNumber = event.Digits;
    const userRecord = db.lookupUserByPSTNPhoneNumber(event.From);

    // Connect inbound caller to conf
    // Create outbound dial to desired PSTN number
    // when that call answers, add to conf
    // save conf-id
    // every {duration} play audio to conf-id

    res.type("application/xml");
    res.send(
      texml.dialTeXML(
        `${userRecord?.telnyxPhoneNumber}`,
        "/dialFinished",
        "POST",
        "record-from-answer-dual",
        "recordFinished",
        `+${phoneNumber}`
      )
    );
  });

router.route("/dialFinished").post(async (req, res) => {
  const event = req.body;
  console.log(event);
  res.sendStatus(200);
});

router.route("/recordFinished").post(async (req, res) => {
  const event = req.body;
  console.log(event);
  res.type("application/xml");
  res.send(texml.hangupTeXML("Thank you for the call, hanging up"));
});

export default router;
