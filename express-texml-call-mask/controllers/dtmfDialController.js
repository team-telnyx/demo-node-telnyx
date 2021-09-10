const express  = require('express');
const router = module.exports = express.Router();
const db = require('../models/db');
const VoiceResponse = require('twilio').twiml.VoiceResponse;

const hangupSentence = 'Thank you for the call, hanging up';

const inboundPSTNAnswerController = async (req, res) => {
  const defaultGatherSentence = 'Hello, please enter the phone number with country code you would like to dial followed by the pound sign';
  const event = req.body;
  console.log(event);
  const response = new VoiceResponse();
  const gather = response.gather({
      action: 'gather',
      method: 'POST',
      maxDigits: 15,
      minDigits: 10,
      finishOnKey: '#'
  });
  gather.say(defaultGatherSentence);
  response.say(hangupSentence);
  response.hangup();
  res.type("application/xml");
  res.send(response.toString());
};

const gatherController = async (req, res) => {
  const event = req.body;
  console.log(event);
  const phoneNumber = event.Digits;
  const userRecord = db.lookupUserByPSTNPhoneNumber(event.From);

  // Connect inbound caller to conf
  // Create outbound dial to desired PSTN number
  // when that call answers, add to conf
  // save conf-id
  // every {duration} play audio to conf-id

  const response = new VoiceResponse();
  response.dial({
    callerId: `${userRecord.telnyxPhoneNumber}`,
    record: 'record-from-answer-dual',
    recordingStatusCallback: 'recordStatus',
    action: 'dialFinished',
    method: 'POST'
  }, `+${phoneNumber}`);
  res.type("application/xml");
  res.send(response.toString());
};

const recordFinishedController = async (req, res) => {
  const event = req.body;
  console.log(event);
  res.type("application/xml");
  res.send(texml.hangupTeXML(hangupSentence));
};

const recordStatusController = async (req, res) => {
  const event = req.body;
  console.log(event);
  res.sendStatus(200);
};

const dialFinishedController = async (req, res) => {
  const event = req.body;
  console.log(event);
  res.sendStatus(200);
};

router.route('/inbound')
  .post(inboundPSTNAnswerController);

router.route('/gather')
  .post(gatherController);

router.route('/recordFinished')
    .post(recordFinishedController);

router.route('/recordStatus')
    .post(recordStatusController);

router.route('/dialFinished')
    .post(dialFinishedController);
