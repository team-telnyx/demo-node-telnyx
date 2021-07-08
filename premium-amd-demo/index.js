// Telnyx Call Control Demo

// Set up environmental variables from .env file
require('dotenv').config()

// Library Requirements
const express = require('express');
const bodyParser = require('body-parser');
const nunjucks = require('nunjucks');
const phone = require('phone');

// Set up telnyx library with user API Key
const telnyx = require('telnyx')(process.env.TELNYX_API_KEY);

// Number settings
const amdNumbers = require('./amdNumbers.json');

// Fire up express app and settings
const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// Set default express engine and extension
app.engine('html', nunjucks.render);
app.set('view engine', 'html');

// configure nunjucks engine
nunjucks.configure('templates/views', {
  autoescape: true,
  express: app
});

// Simple page that can send a phone call
app.get('/', function (req, res) {
  res.render('messageform');
});

app.post('/calls', async (req, res) => {
  console.log('Call request');
  const to_number = phone(req.body.to_number, 'USA')[0];
  const amdSetting = req.body.premium_amd === 'on' ? 'premium' : 'detect_words';
  const webhook_url = (new URL('/call-control/outbound', `${req.protocol}://${req.hostname}`)).href;
  try {
    const callPayload = {
      connection_id: process.env.TELNYX_CONNECTION_ID,
      to: to_number,
      from: process.env.TELNYX_NUMBER,
      answering_machine_detection: amdSetting,
      webhook_url: webhook_url
    }
    console.log(callPayload);
    const { data: call } = await telnyx.calls.create(callPayload);
    res.render('messagesuccess');
  } catch (e) {
    res.send(e);
  }
})

app.post('/call-control/outbound', async (req, res) => {
  res.sendStatus(200);

  const data = req.body.data;
  const event_type = data.event_type;

  switch (event_type) {
    case 'call.machine.premium.detection.ended':
      console.log(`premium detection ended: ${data.payload.result}`);
      break;
    case 'call.machine.premium.greeting.ended':
      console.log(`premium greeting ended: ${data.payload.result}`);
      break;
    case 'call.machine.detection.ended':
      console.log(`default detection ended: ${data.payload.result}`);
      break;
    case 'call.machine.greeting.ended':
      console.log(`default greeting ended: ${data.payload.result}`);
      break;
    default:
      console.log(`Nothing interesting for ${event_type}`);
      break;
    };
});

const texmlController = async (req, res) => {
  const data = req.body;
  const to_number = data.To;
  const numberSettings = amdNumbers[to_number];
  console.log(`Ringing to: ${numberSettings.setting}`);
  const beepPlay = '<Play>https://telnyx-mms-demo.s3.us-east-2.amazonaws.com/voicemails/beep.wav</Play>'
  const texml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${numberSettings.mediaUrl}</Play>
  ${numberSettings.beep ? beepPlay : ''}
  <Play>https://telnyx-mms-demo.s3.us-east-2.amazonaws.com/voicemails/unknownSilence.wav</Play>
</Response>`
  res.send(texml);

};


// Fire up the app on port specified in env
app.use('/call-control/texml/inbound', express.urlencoded({ extended: true }), texmlController);
app.listen(process.env.TELNYX_APP_PORT);
console.log(`Server listening on port ${process.env.TELNYX_APP_PORT}`);