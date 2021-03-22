require('dotenv').config()

const TELNYX_PUBLIC_KEY=process.env.TELNYX_PUBLIC_KEY
const TELNYX_API_KEY=process.env.TELNYX_API_KEY
const PORT=process.env.PORT
const telnyx = require('telnyx')(TELNYX_API_KEY);

const express = require('express');
const app = express();

const webhookValidator = (req, res, next) => {
  try {
    telnyx.webhooks.constructEvent(
      JSON.stringify(req.body, null, 2),
      req.header('telnyx-signature-ed25519'),
      req.header('telnyx-timestamp'),
      TELNYX_PUBLIC_KEY
    )
    next();
    return;
  }
  catch (e) {
    console.log(`Invalid webhook: ${e.message}`);
    return res.status(400).send(`Webhook Error: ${e.message}`);
  }
}

app.use(express.json());
app.use(webhookValidator);

const inboundMessageController = async (req, res) => {
  res.sendStatus(200); // Play nice and respond to webhook
  const event = req.body.data;
  console.log(`Received inbound message with ID: ${event.payload.id}`)
  const dlrUrl = (new URL('/outbound', `${req.protocol}://${req.hostname}`)).href;
  const toNumber = event.payload.to[0].phone_number;
  const fromNumber = event.payload['from'].phone_number;
  const medias = event.payload.media;
  try {
    const messageRequest = {
      from: toNumber,
      to: fromNumber,
      text: '👋 Hello World',
      webhook_url: dlrUrl,
      use_profile_webhooks: false
    }

    const telnyxResponse = await telnyx.messages.create(messageRequest);
    console.log(`Sent message with id: ${telnyxResponse.data.id}`);
  }
  catch (e)  {
    console.log('Error sending message');
    console.log(e);
  }
}

const outboundMessageController = async (req, res) => {
  res.sendStatus(200); // Play nice and respond to webhook
  const event = req.body.data;
  console.log(`Received message DLR with ID: ${event.payload.id}`)
}

app.post('/inbound', inboundMessageController);
app.post('/outbound', outboundMessageController);

app.listen(PORT);
console.log(`Server listening on port ${PORT}`);