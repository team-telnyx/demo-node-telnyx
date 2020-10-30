const express  = require('express');
const fs = require('fs');
const url = require('url');
const telnyx = require('telnyx')(process.env.TELNYX_API_KEY);
const router = module.exports = express.Router();

const toBase64 = data => (new Buffer.from(data)).toString('base64');
const fromBase64 = data => (new Buffer.from(data, 'base64')).toString();

const handleInitiated = async call => {
  console.log(`Call: ${call.call_control_id}; event_type: call.initiated`);
};


const handleAnswered = async call => {
  console.log(`Call: ${call.call_control_id}; event_type: call.answered`);
  const callSpeakRequest = {
    payload: 'Thank you for answering the call!',
    language: 'en-US',
    voice: 'female'
  }
  try {
    await call.speak(callSpeakRequest);
  }
  catch (e) {
    console.log(`Error speaking on answered call: ${call.call_control_id}`);
    console.log(e);
  }
}

const handleGreetingEnd = async call => {
  console.log(`Call: ${call.call_control_id}; event_type: call.machine.greeting.ended`);
  const callSpeakRequest = {
    payload: 'We are leaving you a voicemail',
    language: 'en-US',
    voice: 'female'
  }
  try {
    await call.speak(callSpeakRequest);
  }
  catch (e) {
    console.log(`Error speaking on greeting ended call: ${call.call_control_id}`);
    console.log(e);
  }
}

const handleSpeakEnded = async call => {
  console.log(`Call: ${call.call_control_id}; event_type: call.speak.ended`);
  try {
    await call.hangup();
  }
  catch (e) {
    console.log(`Error hanging up call: ${call.call_control_id}`);
    console.log(e);
  }
}

const handleHangup = async call => {
  console.log(`Call: ${call.call_control_id}; event_type: call.hangup`);
}


const outboundCallController = async (req, res) => {
  res.sendStatus(200); // Play nice and respond to webhook
  const event = req.body.data;
  const call = new telnyx.Call({
    call_control_id: event.payload.call_control_id
  });
  switch (event.event_type) {
    case 'call.initiated':
      handleInitiated(call);
      break;
    case 'call.answered':
      handleAnswered(call);
      break;
    case 'call.machine.greeting.ended':
      handleGreetingEnd(call);
      break
    case 'call.speak.ended':
      handleSpeakEnded(call);
      break;
    case 'call.hangup':
      handleHangup(call);
      break;
    default:
      console.log(`Received Call-Control event: ${event.event_type} DLR with ID: ${event.payload.call_control_id}`);
  }
}


router.route('/outbound')
    .post(outboundCallController)