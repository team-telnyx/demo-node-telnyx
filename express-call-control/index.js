// Telnyx Call Control Demo

// Set up environmental variables from .env file
require('dotenv').config()

// Library Requirements
const express = require('express');
const bodyParser = require('body-parser');
const nunjucks = require('nunjucks');

// Set up telnyx library with user API Key
const telnyx = require('telnyx')(process.env.TELNYX_API_KEY);

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
app.get('/', function (request, response) {
  response.render('messageform');
});

app.post('/outbound', async (request, response) => {
  const to_number = request.body.to_number;

  try {
    const { data: call } = await telnyx.calls.create({ connection_id: process.env.TELNYX_CONNECTION_ID, to: to_number, from: process.env.TELNYX_NUMBER });
    response.render('messagesuccess');
  } catch (e) {
    response.send(e);
  }
})

app.post('/call_control', async (request, response) => {
  response.sendStatus(200);

  data = request.body.data;

  try {
    if (data.event_type == 'call.hangup') {
      console.log('Call has ended.');
    } else if (data.event_type == 'call.initiated') {
      const call = new telnyx.Call({ call_control_id: data.payload.call_control_id });
      call.answer();
    } else if (data.event_type == 'call.answered') {
      const call = new telnyx.Call({ call_control_id: data.payload.call_control_id });
      call.speak({
        payload: 'Hello, Telnyx user! Welcome to this call control demonstration.',
        voice: 'male',
        language: 'en-US'
      });
    } else if (data.event_type == 'call.speak.ended') {
      const call = new telnyx.Call({ call_control_id: data.payload.call_control_id });
      console.log('Speak has ended.');
      call.hangup();
    }
  } catch (error) {
    console.log('Error issuing call command');
    console.log(error);
  }

});

// Fire up the app on port specified in env
app.listen(process.env.TELNYX_APP_PORT);
console.log(`Server listening on port ${process.env.TELNYX_APP_PORT}`);