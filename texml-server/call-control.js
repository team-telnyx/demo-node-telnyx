require('dotenv').config()

const telnyx = require('telnyx')(process.env.TELNYX_API_KEY);
const express = require('express');
const callControlPath = '/call-control/inbound';

const app = express();
const http = require('http').createServer(app);

app.use(express.json());
app.post(callControlPath, async (req, res) => {
  res.sendStatus(200); // Play nice and respond to webhook
  const event = req.body.data;
  const callIds = {
    call_control_id: event.payload.call_control_id,
    call_session_id: event.payload.call_session_id,
    call_leg_id: event.payload.call_leg_id
  }
  const call = new telnyx.Call(callIds);
  switch (event.event_type) {
    case 'call.initiated':
      await call.answer();
      break;
    case 'call.dtmf.received':
      console.log(event.payload.digit)
      break;
    default:
      console.log(`Received Call-Control event: ${event.event_type} DLR with call_session_id: ${call.call_session_id}`);
  }
});

const port = process.env.PORT || 8000;
http.listen(port);
console.log(`Server listening on port: ${port}`);