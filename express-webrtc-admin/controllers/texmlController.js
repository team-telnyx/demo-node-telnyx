const express  = require('express');
const router = module.exports = express.Router();
const texml = require('../packages/texml');
const db = require('../models/db');
const urljoin = require('url-join');
const phone = require('phone');

const defaultGatherSentence = 'Hello, please press 1 to join the conference.';
const hangupSentence = 'Thank you for the call, hanging up';
const conferenceGreeting = 'Thank you for accepting the call, connecting you now';

const conferencePSTNAnswerController = async (req, res) => {
  console.log(req.body);
  res.type("application/xml");
  const storedSentence = await db.getValueByKey('gatherSentence');
  storedSentence.ok ?
      res.send(texml.gatherTeXML(storedSentence.value)) :
      res.send(texml.gatherTeXML(defaultGatherSentence));
}

const inboundPSTNAnswerController = async (req, res) => {
  const conferenceId = await db.getValueByKey('conferenceId');
  if (conferenceId.ok) {
    await conferencePSTNAnswerController(req, res);
    return;
  }
  const promises = [
    db.getValueByKey('sipURI'),
    db.getValueByKey('inboundGreeting')
  ];
  const dbResults = await Promise.allSettled(promises);
  const allOk = dbResults.every(p=>p.value.ok);
  allOk ?
      res.send(texml.transferTexml(dbResults[0].value.value,
          dbResults[1].value.value)) :
      res.send(texml.errorTexml(`Error Establishing call`))
}

const webRtcAnswerController = async (req, res) => {
  console.log(req.body);
  console.log(req.query);
  res.type("application/xml");
  const callRequest = {
    To: phone(req.query.to)[0],
    From: phone(req.query.from)[0],
    Url: urljoin(`${req.protocol}://${req.hostname}`, `texml/pstn-answer`)
  }
  const conferenceId = texml.generateId();
  const promises = [
      texml.createTexmlCall(callRequest),
      db.saveValueByKey('conferenceId', conferenceId),
      db.saveValueByKey('organizationId', req.body.AccountSid)
  ];
  const dbResults = await Promise.allSettled(promises);
  const allOk = dbResults.every(p=>p.value.ok);
  allOk?
      res.send(texml.conferenceTeXML(conferenceGreeting, conferenceId)) :
      res.send(texml.errorTexml(`Error Establishing call`))
}

const gatherController = async (req, res) => {
  console.log(req.body);
  const conferenceId = await db.getValueByKey('conferenceId');
  const event = req.body;
  const digits = parseInt(event.Digits);
  res.type("application/xml");
  (digits === 1 && conferenceId.ok) ?
      res.send(texml.conferenceTeXML(conferenceGreeting, conferenceId.value)) :
      res.send(texml.hangupTeXML(hangupSentence));
}

const conferenceStatusController = async (req, res) => {
  console.log(req.body);
  if (req.body.StatusCallbackEvent === 'conference-end') {
    const dbResult = await db.deleteValueByKey("conferenceId");
  }
  if (req.body.StatusCallbackEvent === 'conference-start') {
    console.log('Conference Started')
  }
  res.sendStatus(200);
}

router.route('/conference')
  .post(conferenceStatusController)

router.route('/gather')
  .post(gatherController)

router.route('/pstn-answer')
    .post(conferencePSTNAnswerController)

router.route('/webrtc-answser/')
  .post(webRtcAnswerController)

router.route('/inbound')
  .post(inboundPSTNAnswerController)
