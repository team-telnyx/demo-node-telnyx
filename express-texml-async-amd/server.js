require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// SSL Certificate paths for cpass.telnyx.solutions
const SSL_CERT_PATH = '/etc/letsencrypt/live/telnyx.solutions/fullchain.pem';
const SSL_KEY_PATH = '/etc/letsencrypt/live/telnyx.solutions/privkey.pem';

// Parse both JSON and URL-encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/**
 * Initial TeXML request handler
 * Returns a response that plays a message while waiting for AMD to complete
 */
function handleTeXMLRequest(req, res) {
  console.log('\n=== Initial TeXML Request ===');
  console.log('Method:', req.method);
  console.log('Query Params:', req.query);
  console.log('Body:', JSON.stringify(req.body, null, 2));

  // Return TeXML that plays a message while AMD is processing in the background
  // We'll update the call with the appropriate message when AMD callback is received
  const texmlResponse = `
    <Response>
      <Say voice="alice">
        Please wait while we connect your call.
      </Say>
      <Pause length="10"/>
      <Say voice="alice">
        Thank you for your patience.
      </Say>
      <Pause length="10"/>
    </Response>
  `.trim();

  res.type('application/xml');
  res.send(texmlResponse);
}

/**
 * Main TeXML endpoint - Telnyx will request TeXML from here
 * This endpoint receives AMD results via the AnsweredBy parameter
 * Supports both GET and POST methods
 */
app.get('/texml', handleTeXMLRequest);
app.post('/texml', handleTeXMLRequest);

/**
 * Status callback endpoint - receives call status updates
 * Listens for AMD callback and updates the call with new instructions
 */
app.post('/texml/status', async (req, res) => {
  console.log('\n=== Status Callback ===');
  console.log('Full Body:', JSON.stringify(req.body, null, 2));

  const payload = req.body.payload || req.body;
  const eventType = req.body.event_type || payload.event_type;
  const callSid = payload.CallSid;
  const answeredBy = payload.AnsweredBy;

  console.log(`Event Type: ${eventType}`);
  console.log(`Call SID: ${callSid}`);
  console.log(`AnsweredBy: ${answeredBy}`);

  // Check if this is an AMD callback (has AnsweredBy field)
  if (answeredBy && callSid) {
    console.log(`\n🎯 AMD Detection Complete: ${answeredBy}`);
    console.log(`   Detection Duration: ${payload.MachineDetectionDuration}ms`);

    // Update the call with new TeXML based on AMD result
    try {
      await updateCallWithTeXML(callSid, answeredBy);
      console.log('✓ Call updated successfully with new TeXML');
    } catch (error) {
      console.error('✗ Failed to update call:', error.response?.data || error.message);
    }
  } else {
    console.log('ℹ️  Non-AMD status callback, ignoring');
  }

  res.sendStatus(200);
});

/**
 * Update an active call with new TeXML instructions
 * @param {string} callSid - The Call SID to update
 * @param {string} answeredBy - AMD result (human, machine, etc.)
 */
async function updateCallWithTeXML(callSid, answeredBy) {
  const accountSid = process.env.TELNYX_ACCOUNT_SID;
  const apiKey = process.env.TELNYX_API_KEY;

  // Generate the TeXML response based on AMD result
  const texmlResponse = generateTeXMLResponse(answeredBy);

  const endpoint = `https://api.telnyx.com/v2/texml/Accounts/${accountSid}/Calls/${callSid}`;

  console.log(`Updating call ${callSid} with inline TeXML`);
  console.log(`TeXML for ${answeredBy}:`, texmlResponse.substring(0, 100) + '...');

  const response = await axios.post(
    endpoint,
    {
      Texml: texmlResponse  // Provide inline TeXML directly
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }
  );

  return response.data;
}


/**
 * Generate TeXML response based on AMD result
 * @param {string} answeredBy - AMD result: human|machine_start|machine_end_beep|machine_end_other|fax|unknown
 * @returns {string} TeXML XML response
 */
function generateTeXMLResponse(answeredBy) {
  let message;

  switch (answeredBy) {
    case 'human':
    case 'human_residence':
    case 'unknown':
      // Human answered - play personalized message
      message = `
        <Response>
          <Say voice="alice">
            Hello! This is a call from Acme Corporation.
            We're reaching out regarding your recent inquiry about our services.
            A representative will be with you shortly to discuss your options.
            Please stay on the line.
          </Say>
          <Pause length="1"/>
          <Say voice="alice">
            Thank you for your time. Have a great day!
          </Say>
          <Hangup/>
        </Response>
      `;
      break;

    case 'machine_end_beep':
    case 'machine_end_other':
      // Voicemail/answering machine - leave a brief message
      message = `
        <Response>
          <Pause length="1"/>
          <Say voice="alice">
            Hi, this is a message from Acme Corporation.
            We wanted to reach you regarding your recent inquiry.
            Please call us back at 1-800-555-0123 at your earliest convenience.
            Again, that's 1-800-555-0123. Thank you!
          </Say>
          <Hangup/>
        </Response>
      `;
      break;

    case 'fax':
      // Fax machine detected
      message = `
        <Response>
          <Hangup/>
        </Response>
      `;
      break;

    case 'unknown':
    default:
      // Unknown or no AMD result - play default message
      message = `
        <Response>
          <Say voice="alice">
            Hello! This is a call from Acme Corporation.
            Please call us back at 1-800-555-0123. Thank you!
          </Say>
          <Hangup/>
        </Response>
      `;
      break;
  }

  return message.trim();
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'TeXML AMD Server' });
});

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.send(`
    <h1>Telnyx TeXML AMD Server</h1>
    <p>This server handles TeXML requests with premium answering machine detection.</p>
    <ul>
      <li>POST /texml - Main TeXML endpoint</li>
      <li>POST /texml/status - Status callback endpoint</li>
      <li>GET /health - Health check</li>
    </ul>
  `);
});

// Start HTTPS server
try {
  const httpsOptions = {
    cert: fs.readFileSync(SSL_CERT_PATH),
    key: fs.readFileSync(SSL_KEY_PATH)
  };

  const server = https.createServer(httpsOptions, app);

  server.listen(PORT, () => {
    console.log(`\n🚀 TeXML AMD Server running on HTTPS port ${PORT}`);
    console.log(`   TeXML endpoint: https://cpass.telnyx.solutions:${PORT}/texml`);
    console.log(`   Status callback: https://cpass.telnyx.solutions:${PORT}/texml/status`);
    console.log(`   Health check: https://cpass.telnyx.solutions:${PORT}/health`);
    console.log(`\n✓ SSL enabled with Let's Encrypt certificates for telnyx.solutions\n`);
  });

  module.exports = server;
} catch (error) {
  console.error('❌ Failed to start HTTPS server:', error.message);
  console.error('Make sure SSL certificates exist at:');
  console.error(`   ${SSL_CERT_PATH}`);
  console.error(`   ${SSL_KEY_PATH}`);
  process.exit(1);
}
