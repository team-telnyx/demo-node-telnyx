// server.js
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Telnyx configuration
const TELNYX_API_KEY = process.env.TELNYX_API_KEY;
const CONNECTION_ID = process.env.CONNECTION_ID; // Must be a valid Call Control App ID with a webhook URL set in Telnyx
const TELNYX_API_BASE = 'https://api.telnyx.com/v2';
const FROM_NUMBER = process.env.FROM_NUMBER; // Your Telnyx number

// Global variables to hold active call session IDs and answered statuses.
let activeCallControlId = null;  // Party A's call_control_id
let partyBCallControlId = null;  // Party B's call_control_id
const answeredCalls = {};        // { call_control_id: true }

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Dial a call leg using Telnyx Dial API.
 * If linkTo is provided, the call joins the same session.
 */
async function dialCallBridge(to, from) {
  try {
    const url = `${TELNYX_API_BASE}/calls`;
    const payload = {
      connection_id: CONNECTION_ID,
      to,
      from,
      timeout_secs: 30
    };
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${TELNYX_API_KEY}`
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Dial call bridge error:', error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * Dial a supervisor call using Telnyx Dial API.
 * The payload explicitly includes:
 *   - link_to (to join the active session),
 *   - supervisor_role, and
 *   - supervise_call_control_id (set to the active call's id)
 */
async function dialCallSupervisor(to, from, supervisorRole, superviseCallControlId) {
  try {
    const url = `${TELNYX_API_BASE}/calls`;
    const payload = {
      connection_id: CONNECTION_ID,
      to,
      from,
      timeout_secs: 30,
      supervisor_role: supervisorRole, // "barge", "monitor", or "whisper"
      supervise_call_control_id: superviseCallControlId
    };
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${TELNYX_API_KEY}`
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Dial supervisor error:', error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * Bridge two call legs using Telnyx Bridge API.
 * See: https://developers.telnyx.com/api/call-control/bridge-call
 */
async function bridgeCalls(callControlIdA, callControlIdB) {
  try {
    const url = `${TELNYX_API_BASE}/calls/${callControlIdA}/actions/bridge`;
    const payload = {
      call_control_id: callControlIdB
    };
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${TELNYX_API_KEY}`
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Bridge call error:', error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * Endpoint to bridge calls.
 * Accepts JSON: { bridgeANumber, bridgeBNumber }
 */
app.post('/bridge-calls', async (req, res) => {
  try {
    const { bridgeANumber, bridgeBNumber } = req.body;
    if (!bridgeANumber || !bridgeBNumber) {
      return res.status(400).json({ error: 'Both bridgeANumber and bridgeBNumber are required.' });
    }
    // Dial Party A.
    const partyA = await dialCallBridge(bridgeANumber, FROM_NUMBER);
    console.log('Party A dialed:', partyA);
    activeCallControlId = partyA.call_control_id;

    // Dial Party B with link_to set to Party A's call_control_id.
    const partyB = await dialCallBridge(bridgeBNumber, FROM_NUMBER, activeCallControlId);
    console.log('Party B dialed:', partyB);
    partyBCallControlId = partyB.call_control_id;

    res.json({ message: 'Bridge call initiated. Waiting for both parties to answer.' });
  } catch (error) {
    console.error("Error in /bridge-calls:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: error.response ? error.response.data : error.message });
  }
});

/**
 * Webhook endpoint to receive Telnyx call events.
 * Expected payload structure:
 * {
 *   "data": {
 *     "event_type": "call.answered",
 *     "payload": { "call_control_id": "..." },
 *     ...
 *   },
 *   "meta": { ... }
 * }
 */
app.post('/webhook', (req, res) => {
  const webhookPayload = req.body;
  if (!webhookPayload || !webhookPayload.data) {
    console.error("Webhook payload missing 'data'");
    return res.status(400).send("Missing data");
  }
  const event = webhookPayload.data;
  if (!event.event_type) {
    console.error("Webhook event_type undefined. Full payload:", webhookPayload);
    return res.status(400).send("event_type undefined");
  }
  console.log('Received webhook event_type:', event.event_type);

  if (event.event_type === 'call.answered') {
    const callControlId = event.payload && event.payload.call_control_id;
    if (callControlId) {
      answeredCalls[callControlId] = true;
      console.log(`Call answered: ${callControlId}`);
  
      // Check if both Party A and Party B are answered.
      if (activeCallControlId && partyBCallControlId &&
          answeredCalls[activeCallControlId] && answeredCalls[partyBCallControlId]) {
        console.log('Both calls answered. Bridging now...');
        bridgeCalls(activeCallControlId, partyBCallControlId)
          .then(bridgeResult => console.log('Bridge result:', bridgeResult))
          .catch(err => console.error('Error bridging calls:', err));
      }
    } else {
      console.error("Missing call_control_id in event payload", event.payload);
    }
  }
  res.status(200).send('OK');
});

/**
 * Endpoint to dial the supervisor call.
 * Expects JSON body: { supervisorNumber, supervisorRole }
 */
app.post('/bridge-supervisor', async (req, res) => {
  try {
    const { supervisorNumber, supervisorRole } = req.body;
    const fromNumber = process.env.SUPERVISOR_FROM_NUMBER || '+12896674203';

    if (!activeCallControlId) {
      return res.status(400).json({ error: 'No active call session. Please start the call flow first.' });
    }

    const supervisorCall = await dialCallSupervisor(
      supervisorNumber,
      fromNumber,
      supervisorRole,
      activeCallControlId  // using Party A's call_control_id as the leg to supervise
    );
    console.log('Supervisor call dialed:', supervisorCall);
    console.log('Supervise Call Control ID', activeCallControlId)
    res.json({
      message: `Supervisor call dialed with role ${supervisorRole}`,
      supervisor: supervisorCall
    });
  } catch (error) {
    console.error("Error in /bridge-supervisor:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: error.response ? error.response.data : error.message });
  }
});

// Serve the frontend webpage.
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
