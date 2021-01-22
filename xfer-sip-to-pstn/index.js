
require('dotenv').config()

const call_control_db = [];

const TELNYX_PUBLIC_KEY=process.env.TELNYX_PUBLIC_KEY
const TELNYX_API_KEY=process.env.TELNYX_API_KEY
const PORT=process.env.PORT
const telnyx = require('telnyx')(TELNYX_API_KEY);

const express = require('express');
const app = express();

const toBase64 = data => (new Buffer.from(data)).toString('base64');
const fromBase64 = data => (new Buffer.from(data, 'base64')).toString();

// const webhookValidator = (req, res, next) => {
//   try {
//     telnyx.webhooks.constructEvent(
//       JSON.stringify(req.body, null, 2),
//       req.header('telnyx-signature-ed25519'),
//       req.header('telnyx-timestamp'),
//       TELNYX_PUBLIC_KEY
//     )
//     next();
//     return;
//   }
//   catch (e) {
//     console.log(`Invalid webhook: ${e.message}`);
//     return res.status(400).send(`Webhook Error: ${e.message}`);
//   }
// }


// {
//     "created_at": "2021-01-05T22:27:01.731165Z",
//     "event_type": "call_initiated",
//     "id": "e87f1cbe-3b73-4207-8175-1cecca349734",
//     "payload": {
//         "call_control_id": "v2:FVzxCzU4qUPGQTPsngLF7MKqf9B5aDXk3l3wVbgZZVgr-SdGR0ryFQ",
//         "call_leg_id": "21717a5c-4fa5-11eb-8044-02420a0f6e68",
//         "call_session_id": "2171845c-4fa5-11eb-8c0e-02420a0f6e68",
//         "caller_id_name": "Telnyx Web Dialer",
//         "client_state": null,
//         "connection_id": "1542992939477632791",
//         "direction": "outgoing",
//         "from": "+19842550944",
//         "occurred_at": "2021-01-05T22:27:01.404413Z",
//         "start_time": "2021-01-05T22:27:01.404413Z",
//         "state": "parked",
//         "to": "+18004377950"
//     },
//     "record_type": "event"
// }

app.use(express.json());
// app.use(webhookValidator);

const transferEvents = (req, res) => {
  res.sendStatus(200);
  const event_type = req.body.event_type;
  console.log(req.body);
  console.log(fromBase64(req.body.payload.client_state))
  if (event_type === 'dtmf'){
    // do button press logic for "WEBRTC" user
    console.log(req.body.payload.digit)
  }
}

const fromSip = async (req, res) => {
  res.sendStatus(200);
  const event_type = req.body.event_type;
  if (event_type !== 'call_initiated'){
    console.log(event_type);
    return;
  }
  if (event_type === 'dtmf'){
    // do button press logic for "WEBRTC" user
    console.log(req.body.payload.digit)
  }
  const transferTo = req.body.payload.to;
  const transferFrom = req.body.payload.from;

  const callIds = {
    call_control_id: req.body.payload.call_control_id,
    call_session_id: req.body.payload.call_session_id,
    call_leg_id:  req.body.payload.call_leg_id
  };
  const call = new telnyx.Call(callIds);
  try {
    const a = await call.transfer({
      to: transferTo,
      from: "+19842550944",
      webhook_url: "http://telnyx-demo.ngrok.io/transferEvents",
      client_state: toBase64("Hello World")
    });
  }
  catch (e) {
    console.log(e);
  }

}


const fromPSTN = async (req, res) => {
  const db = {
    "+19842550944": "sip:dant13294@sip.telnyx.com"
  }
  res.sendStatus(200);
  const event_type = req.body.data.event_type;
  const transferTo = req.body.data.payload.to;
  const transferFrom = req.body.data.payload.from;

  const callIds = {
    call_control_id: req.body.data.payload.call_control_id,
    call_session_id: req.body.data.payload.call_session_id,
    call_leg_id:  req.body.data.payload.call_leg_id
  };
  const call = new telnyx.Call(callIds);
  if (event_type === 'call.initiated'){
    // just answer the call
    call.answer();
    console.log(event_type);
  }

  else if (event_type === 'call.answered') {
    // now we need our phone-number to SIP URI mapping
    call.transfer({
      to: db["+19842550944"],
      webhook_url: "http://telnyx-demo.ngrok.io/transferEvents"
    });
  }
}




app.post('/transferEvents', transferEvents);

app.post('/fromSip', fromSip);
app.post('/fromPSTN', fromPSTN);


app.listen(PORT);
console.log(`Server listening on port ${PORT}`);