require('dotenv').config();
const fs = require('fs');
const https = require('https');
const express = require('express');
const cors = require('cors');
const Telnyx = require('telnyx');

const app = express();
const telnyx = new Telnyx({ apiKey: process.env.TELNYX_API_KEY });

const PORT = process.env.PORT || 3000;
const CONNECTION_ID = process.env.TELNYX_CONNECTION_ID;
const TELNYX_PHONE_NUMBER = process.env.TELNYX_PHONE_NUMBER;
let agentPhoneNumber = process.env.AGENT_PHONE_NUMBER || 'sip:phillip1995@sip.telnyx.com';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory call session tracking
// Key: pstnCallControlId, Value: { pstnCallControlId, agentCallControlId, thirdPartyCallControlId, status, from }
const callSessions = new Map();

// SSE clients
const sseClients = new Set();

function broadcastCalls() {
  const calls = Array.from(callSessions.values());
  const data = JSON.stringify({ calls });
  for (const res of sseClients) {
    res.write(`data: ${data}\n\n`);
  }
}

// Helper to encode client_state
function encodeClientState(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64');
}

// Helper to decode client_state
function decodeClientState(encoded) {
  try {
    return JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'));
  } catch {
    return {};
  }
}

// ─── Webhook Handler ──────────────────────────────────────────────────────────
app.post('/webhooks', async (req, res) => {
  const event = req.body.data;
  const eventType = event?.event_type;
  const payload = event?.payload;

  if (!eventType || !payload) {
    return res.sendStatus(200);
  }

  console.log(`[webhook] ${eventType} | call_control_id: ${payload.call_control_id}`);

  try {
    switch (eventType) {
      case 'call.initiated': {
        if (payload.direction === 'incoming') {
          console.log(`[incoming] Answering call from ${payload.from}`);
          await telnyx.calls.actions.answer(payload.call_control_id, {
            client_state: encodeClientState({ role: 'pstn_caller' }),
          });
        }
        break;
      }

      case 'call.answered': {
        const clientState = payload.client_state
          ? decodeClientState(payload.client_state)
          : {};

        if (clientState.role === 'pstn_caller') {
          const pstnCallControlId = payload.call_control_id;
          console.log(`[pstn answered] Dialing agent at ${agentPhoneNumber}`);

          // Store session
          callSessions.set(pstnCallControlId, {
            pstnCallControlId,
            agentCallControlId: null,
            thirdPartyCallControlId: null,
            status: 'dialing_agent',
            from: payload.from,
          });
          broadcastCalls();

          // Dial the agent
          const dialResponse = await telnyx.calls.dial({
            connection_id: CONNECTION_ID,
            to: agentPhoneNumber,
            from: TELNYX_PHONE_NUMBER,
            client_state: encodeClientState({
              role: 'agent',
              pstnCallControlId,
            }),
          });

          const agentCallControlId = dialResponse.data.call_control_id;
          const session = callSessions.get(pstnCallControlId);
          if (session) {
            session.agentCallControlId = agentCallControlId;
            session.status = 'ringing_agent';
          }
          broadcastCalls();
        }

        if (clientState.role === 'agent') {
          const pstnCallControlId = clientState.pstnCallControlId;
          const agentCallControlId = payload.call_control_id;
          console.log(`[agent answered] Bridging PSTN ${pstnCallControlId} with agent ${agentCallControlId}`);

          // Bridge PSTN leg with agent leg
          await telnyx.calls.actions.bridge(pstnCallControlId, {
            call_control_id_to_bridge_with: agentCallControlId,
            park_after_unbridge: 'self',
          });

          const session = callSessions.get(pstnCallControlId);
          if (session) {
            session.agentCallControlId = agentCallControlId;
            session.status = 'bridged';
          }
          broadcastCalls();
        }
        break;
      }

      case 'call.bridged': {
        console.log(`[bridged] call_control_id: ${payload.call_control_id}`);
        break;
      }

      case 'call.hangup': {
        const callControlId = payload.call_control_id;
        console.log(`[hangup] call_control_id: ${callControlId}`);

        // Check if this is a PSTN leg
        if (callSessions.has(callControlId)) {
          callSessions.delete(callControlId);
          broadcastCalls();
          break;
        }

        // Check if this is an agent or third-party leg
        for (const [key, session] of callSessions) {
          if (session.agentCallControlId === callControlId || session.thirdPartyCallControlId === callControlId) {
            if (session.thirdPartyCallControlId === callControlId) {
              session.thirdPartyCallControlId = null;
              session.status = 'bridged';
              console.log(`[hangup] Third party left, session continues`);
            } else if (session.agentCallControlId === callControlId) {
              session.agentCallControlId = null;
              session.status = 'agent_left';
              console.log(`[hangup] Agent left`);
            }
            broadcastCalls();
            break;
          }
        }
        break;
      }

      default:
        console.log(`[webhook] Unhandled event: ${eventType}`);
    }
  } catch (err) {
    console.error(`[webhook error] ${eventType}:`, err.message);
  }

  res.sendStatus(200);
});

// ─── API Routes ───────────────────────────────────────────────────────────────

// Get agent destination
app.get('/api/agent-destination', (req, res) => {
  res.json({ destination: agentPhoneNumber });
});

// Set agent destination
app.put('/api/agent-destination', (req, res) => {
  const { destination } = req.body;
  if (!destination || !destination.trim()) {
    return res.status(400).json({ error: 'destination is required' });
  }
  agentPhoneNumber = destination.trim();
  console.log(`[config] Agent destination updated to: ${agentPhoneNumber}`);
  res.json({ success: true, destination: agentPhoneNumber });
});

// Get active calls
app.get('/api/calls', (req, res) => {
  const calls = Array.from(callSessions.values());
  res.json({ calls });
});

// SSE stream
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write(`data: ${JSON.stringify({ calls: Array.from(callSessions.values()) })}\n\n`);
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

// Dial third party with supervisor barge
app.post('/api/dial-third-party', async (req, res) => {
  const { phoneNumber, pstnCallControlId, supervisorRole } = req.body;

  if (!phoneNumber || !pstnCallControlId) {
    return res.status(400).json({ error: 'phoneNumber and pstnCallControlId are required' });
  }

  const role = ['barge', 'whisper', 'monitor'].includes(supervisorRole) ? supervisorRole : 'barge';

  const session = callSessions.get(pstnCallControlId);
  if (!session) {
    return res.status(404).json({ error: 'Call session not found' });
  }

  try {
    console.log(`[dial-third-party] Dialing ${phoneNumber} with ${role} on ${pstnCallControlId}`);

    const dialResponse = await telnyx.calls.dial({
      connection_id: CONNECTION_ID,
      to: phoneNumber,
      from: TELNYX_PHONE_NUMBER,
      supervise_call_control_id: pstnCallControlId,
      supervisor_role: role,
    });

    session.thirdPartyCallControlId = dialResponse.data.call_control_id;
    session.status = 'three_way';

    res.json({
      success: true,
      thirdPartyCallControlId: dialResponse.data.call_control_id,
    });
  } catch (err) {
    console.error('[dial-third-party error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Start Server (HTTPS) ─────────────────────────────────────────────────────
const sslOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/telnyx.solutions/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/telnyx.solutions/fullchain.pem'),
};

https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`Warm Transfer server running on HTTPS port ${PORT}`);
  console.log(`Webhook URL: https://cpaas.telnyx.solutions/webhooks`);
  console.log(`Front-end: https://localhost:${PORT}`);
});
