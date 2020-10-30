const express  = require('express');
const fs = require('fs');
const url = require('url');
const telnyx = require('telnyx')(process.env.TELNYX_API_KEY);
const router = module.exports = express.Router();

const toBase64 = data => (new Buffer.from(data)).toString('base64');
const fromBase64 = data => (new Buffer.from(data, 'base64')).toString();

const introToMobyDick = "Call me Ishmael. Some years ago - never mind how long precisely - having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world. It is a way I have of driving off the spleen and regulating the circulation. Whenever I find myself growing grim about the mouth; whenever it is a damp, drizzly November in my soul; whenever I find myself involuntarily pausing before coffin warehouses, and bringing up the rear of every funeral I meet; and especially whenever my hypos get such an upper hand of me, that it requires a strong moral principle to prevent me from deliberately stepping into the street, and methodically knocking people's hats off - then, I account it high time to get to sea as soon as I can. This is my substitute for pistol and ball. With a philosophical flourish Cato throws himself upon his sword; I quietly take to the ship. There is nothing surprising in this. If they but knew it, almost all men in their degree, some time or other, cherish very nearly the same feelings towards the ocean with me.";

const handleInitiated = async (call, event) => {
  console.log(`call_session_id: ${call.call_session_id}; event_type: ${event.event_type}`);
};


const handleHuman = async (call) => {
  console.log(`call_session_id: ${call.call_session_id}; was likely answered by a human`);
  const callSpeakRequest = {
    payload: 'Thank you for answering the call!',
    language: 'en-US',
    voice: 'female'
  }
  try {
    await call.speak(callSpeakRequest);
  }
  catch (e) {
    console.log(`Error speaking on answered call_session_id: ${call.call_session_id}`);
    console.log(e);
  }
}

const handleMachine = async (call) => {
  console.log(`call_session_id: ${call.call_session_id}; was likely answered by a machine`);
  const callSpeakRequest = {
    payload: introToMobyDick,
    language: 'en-US',
    voice: 'female'
  }
  try {
    await call.speak(callSpeakRequest);
  }
  catch (e) {
    console.log(`Error speaking on handleGreetingEnded call_session_id: ${call.call_session_id}`);
    console.log(e);
  }
}

const handleDetectionEnded = async (call, event) => {
  console.log(`call_session_id: ${call.call_session_id}; event_type: ${event.event_type}`);
  if (event.payload.result !== 'machine') {
    // If it's not a machine, go ahead and proceed as if human answer
    handleHuman(call);
  }
}

const handleGreetingEnded = async (call, event) => {
  console.log(`call_session_id: ${call.call_session_id}, event: ${event.event_type}`);
  handleMachine(call);
}

const handleSpeakEnded = async (call, event) => {
  const status = event.payload.status;
  console.log(`call_session_id: ${call.call_session_id}; event_type: ${event.event_type}, status: ${status}`);
  if (event.payload.status !== 'call_hangup') {
    try {
      await call.hangup();
    } catch (e) {
      console.log(`Error hanging up call_session_id: ${call.call_session_id}`);
      console.log(e);
    }
  }
}

const handleHangup = async (call, event) => {
  console.log(`call_session_id: ${call.call_session_id}; event_type: ${event.event_type}`);
}

const outboundCallController = async (req, res) => {
  res.sendStatus(200); // Play nice and respond to webhook
  const event = req.body.data;
  const callIds = {
    call_control_id: event.payload.call_control_id,
    call_session_id: event.payload.call_session_id,
    call_leg_id:  event.payload.call_leg_id
  }
  const call = new telnyx.Call(callIds);
  switch (event.event_type) {
    case 'call.initiated':
      handleInitiated(call, event);
      break;
    case 'call.machine.detection.ended':
      handleDetectionEnded(call, event);
      break
    case 'call.machine.greeting.ended':
      handleGreetingEnded(call, event);
      break
    case 'call.speak.ended':
      handleSpeakEnded(call, event);
      break;
    case 'call.hangup':
      handleHangup(call, event);
      break;
    default:
      console.log(`Received Call-Control event: ${event.event_type} DLR with call_session_id: ${call.call_session_id}`);
  }
}

const handleInboundAnswer = async (call, event) => {
  console.log(`call_session_id: ${call.call_session_id}; event_type: ${event.event_type}`);
  const callSpeakRequest = {
    payload: introToMobyDick,
    language: 'en-US',
    voice: 'female'
  }
  try {
    await call.speak(callSpeakRequest);
  }
  catch (e) {
    console.log(`Error speaking on call_session_id: ${call.call_session_id}`);
    console.log(e);
  }
}

const inboundCallController = async (req, res) => {
  res.sendStatus(200); // Play nice and respond to webhook
  const event = req.body.data;
  const callIds = {
    call_control_id: event.payload.call_control_id,
    call_session_id: event.payload.call_session_id,
    call_leg_id:  event.payload.call_leg_id
  }
  const call = new telnyx.Call(callIds);
  switch (event.event_type) {
    case 'call.initiated':
      await call.answer();
      break;
    case 'call.answered':
      handleInboundAnswer(call, event);
      break;
    case 'call.speak.ended':
      handleSpeakEnded(call, event);
      break;
    case 'call.hangup':
      handleHangup(call, event);
      break;
    default:
      console.log(`Received Call-Control event: ${event.event_type} DLR with call_session_id: ${call.call_session_id}`);
  }
}

router.route('/outbound')
    .post(outboundCallController)

router.route('/inbound')
  .post(inboundCallController)