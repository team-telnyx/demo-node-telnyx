require('dotenv').config()

const express = require('express');
const telnyx = require('telnyx')(process.env.TELNYX_API_KEY);

const callControlPath = '/call-control';
const callControlOutboundPath = `${callControlPath}/outbound`;
const webhookUrl = (new URL(callControlOutboundPath, process.env.BASE_URL)).href;

const callControl = require('./callControl');
const app = express();

app.use(express.json());

app.use(callControlPath, callControl);

app.post('/calls', async (req, res) => {
  const destinationNumber = req.body.to;
  const telnyxPhoneNumber = req.body.from;
  const createCallRequest = {
    connection_id: process.env.TELNYX_CONNECTION_ID,
    to: destinationNumber,
    from: telnyxPhoneNumber,
    answering_machine_detection: "detect_words",
    webhook_url: webhookUrl
  }
  try {
    const { data: call } = await telnyx.calls.create(createCallRequest);
    res.status(201).send({
          call_control_id: call.call_control_id,
          call_leg_id: call.call_leg_id,
          call_session_id: call.call_session_id
        });
    console.log(`Created outbound call_session_id: ${call.call_session_id}`);
  }
  catch (e) {
    console.log('Error creating call');
    console.log(e);
    res.status(400).send(e);
  }
});

app.listen(process.env.TELNYX_APP_PORT);
console.log(`Server listening on port ${process.env.TELNYX_APP_PORT}`);