const express  = require('express');
const router = module.exports = express.Router();
const db = require('../models/db');
const VoiceResponse = require('twilio').twiml.VoiceResponse;

const hangupSentence = 'Thank you for the call, hanging up';

const inboundPSTNAnswerController = async (req, res) => {
  const event = req.body;
  db.saveLiveCall(event);
  const proxyRecord = db.lookupProxyByPSTNPhoneNumber(event.To);
  const userRecord = db.lookupUserByPSTNPhoneNumber(event.To);
  const response = new VoiceResponse();
  const dial = response.dial({
    callerId: `${userRecord.telnyxPhoneNumber}`,
    record: 'record-from-answer-dual',
    recordingStatusCallback: 'recordStatus',
    action: 'dialFinished'
  }, proxyRecord.dialedPhoneNumber)
  res.type("application/xml");
  res.send(response.toString());
};

const recordStatusController = async (req, res) => {
  console.log(req.body);
  const event = req.body;
  res.sendStatus(200);
};

const dialFinishedController = async (req, res) => {
  console.log(req.body);
  const event = req.body;
  res.sendStatus(200);
};



router.route('/inbound')
  .post(inboundPSTNAnswerController);

router.route('/recordFinished')
    .post(recordFinishedController);

router.route('/recordStatus')
    .post(recordStatusController);

router.route('/dialFinished')
    .post(dialFinishedController);
