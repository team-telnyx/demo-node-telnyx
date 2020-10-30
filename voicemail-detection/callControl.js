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

const introToMobyDick = "Call me Ishmael. Some years ago - never mind how long precisely - having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world. It is a way I have of driving off the spleen and regulating the circulation. Whenever I find myself growing grim about the mouth; whenever it is a damp, drizzly November in my soul; whenever I find myself involuntarily pausing before coffin warehouses, and bringing up the rear of every funeral I meet; and especially whenever my hypos get such an upper hand of me, that it requires a strong moral principle to prevent me from deliberately stepping into the street, and methodically knocking people's hats off - then, I account it high time to get to sea as soon as I can. This is my substitute for pistol and ball. With a philosophical flourish Cato throws himself upon his sword; I quietly take to the ship. There is nothing surprising in this. If they but knew it, almost all men in their degree, some time or other, cherish very nearly the same feelings towards the ocean with me.";

const handleHuman = async call => {
  console.log(`Call: ${call.call_control_id}; was likely answered by a human`);
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

const handleMachine = async call => {
    console.log(`Call: ${call.call_control_id}; was likely answered by a machine`);
    const callSpeakRequest = {
      payload: introToMobyDick,
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

const handleDetectionEnded = async (call, event) => {
  console.log(`Call: ${call.call_control_id}; event_type: call.machine.detection.ended`);
  if (event.payload.result !== 'machine') {
    handleHuman(call);
  }
  else {
    handleMachine(call);
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
    case 'call.machine.detection.ended':
      handleDetectionEnded(call, event);
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