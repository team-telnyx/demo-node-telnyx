const express  = require('express');
const router = module.exports = express.Router();
const texml = require('../packages/texml');
const db = require('../models/db');

const defaultGatherSentence = 'Hello, please press 1 to connect to sales or 2 to leave a voicemail';
const hangupSentence = 'Thank you for the call, hanging up';
const transferGreeting = 'Thank you, connecting you now';

const inboundPSTNAnswerController = async (req, res) => {
  console.log(req.body);
  const event = req.body;
  res.type("application/xml");
  res.send(texml.gatherTeXML(defaultGatherSentence));
}

const gatherController = async (req, res) => {
  console.log(req.body);
  const event = req.body;
  const digits = parseInt(event.Digits);
  const record = db.lookupByPhoneNumber(event.To);
  res.type("application/xml");
  switch (digits) {
    case 1:
      res.send(texml.transferTeXML(transferGreeting, record.sip, record.pstn));
      break;
    case 2:
      res.send(texml.recordTeXML(record.voicemailUrl));
      break;
    default:
      res.send(texml.hangupTeXML(hangupSentence));
      break;
  }
}

const recordFinishedController = async (req, res) => {
  console.log(req.body);
  const event = req.body;
  res.type("application/xml");
  res.send(texml.hangupTeXML(hangupSentence));
}

const recordStatusController = async (req, res) => {
  console.log(req.body);
  const event = req.body;
  res.sendStatus(200);
}

router.route('/inbound')
  .post(inboundPSTNAnswerController)

router.route('/gather')
  .post(gatherController)

router.route('/recordFinished')
    .post(recordFinishedController)

router.route('/recordStatus')
    .post(recordStatusController)

