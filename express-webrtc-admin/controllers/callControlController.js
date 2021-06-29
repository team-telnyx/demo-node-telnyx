const express  = require('express');
const router = module.exports = express.Router();
const telnyx = require('telnyx')(process.env.TELNYX_API_KEY);
const urljoin = require('url-join');
const phone = require('phone');
const Session = require('../models/Session');
const User = require('../models/User');
const errorLogger = require('../packages/utils').errorLogger;

/**
 * Create Session db entry
 * @param call
 * @returns {Promise<{ok: boolean, error: *}|{data: this, ok: boolean}>}
 */
const createSession = async call => {
  try {
    const sessionEntry = {
      inboundCallerPhoneNumber: call.data.from,
      telnyxPhoneNumber: call.data.to,
      inboundCallControl: {
        callControlId: call.data.call_control_id,
        callSessionId: call.data.call_session_id,
        callLegId: call.data.call_leg_id,
      },
      callStartTime: call.data.start_time
    }
    const session = new Session(sessionEntry);
    const dbResult = await session.save();
    return {
      ok: true,
      data: dbResult
    };
  }
  catch (e) {
    return errorLogger(createSession.name, e);
  }
}

/**
 * Returns all online and available agents
 * @returns {Promise<{ok: boolean, error: *}|{data: *, ok: boolean}>}
 */
const findOnlineAgents = async () => {
  try {
    const agents = await User.find({
      online: true,
      active: false
    });
    return {
      ok: true,
      data: agents
    }
  }
  catch (e) {
    return errorLogger(findOnlineAgents.name, e);
  }
}

/**
 * Creates the outbound calls to all the specified agents
 * @param agents
 * @returns {Promise<{data: string, ok: boolean}|{ok: boolean, error: *}>}
 */
const createCallsToAgents = async agents => {
  try {
    const a = "b";
    return {
      ok: true,
      data: a
    };
  }
  catch (e) {
    return errorLogger(createCallsToAgents.name, e)
  }
};

/**
 * Saves the calls to the session
 * @param calls
 * @param session
 * @returns {Promise<{data: string, ok: boolean}|{ok: boolean, error: *}>}
 */
const saveCallsToSession = async (calls, session) => {
  try {
    const a = "b";
    return {
      ok: true,
      data: a
    };
  }
  catch (e) {
    return errorLogger(saveCallsToSession.name, e)
  }
}

/**
 * Creates a session and starts the outbound dials
 * @param call
 * @returns {Promise<void>}
 */
const newSessionHandler = async call => {
  const session = await createSession(call);
  if (!session.ok) {
    return;
  }
  const onlineAgents = await findOnlineAgents();
  if (!onlineAgents.ok) {
    return;
  }
  const calls = await createCallsToAgents(onlineAgents.data);
  if (!calls.ok) {
    return;
  }
  const updatedSession = await saveCallsToSession(calls, session);

}

const inboundPSTNCallController = async (req, res) => {
  res.sendStatus(200); // Play nice and respond to webhook
  const event = req.body.data;
  const callIds = {
    call_control_id: event.payload.call_control_id,
  }
  const call = new telnyx.Call(callIds);
  call.data = {...event.payload};
  switch (event.event_type) {
    case 'call.initiated':
      await newSessionHandler(call);
      break;
    case 'call.answered':
      await handleInboundAnswer(call, event, req);
      break;
    case 'call.hangup':
      await handleInboundHangup(call, event);
      break;
    default:
      console.log(`Received Call-Control event: ${event.event_type} DLR with call_session_id: ${call.call_session_id}`);
  }
}

const webRtcAnswerController = async (req, res) => {
  res.sendStatus(200); // Play nice and respond to webhook
  const event = req.body.data;
  const callIds = {
    call_control_id: event.payload.call_control_id,
  }
  const call = new telnyx.Call(callIds);
  call.data = {...event.payload};
  switch (event.event_type) {
    case 'call.initiated':
      await newSessionHandler(call);
      break;
    case 'call.answered':
      await handleInboundAnswer(call, event, req);
      break;
    case 'call.hangup':
      handleInboundHangup(call, event);
      break;
    default:
      console.log(`Received Call-Control event: ${event.event_type} DLR with call_session_id: ${call.call_session_id}`);
  }
}


router.route('/outbound/')
  .post(webRtcAnswerController)

router.route('/inbound')
  .post(inboundPSTNCallController)
