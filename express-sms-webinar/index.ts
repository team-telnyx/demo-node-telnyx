import "dotenv/config";

import Telnyx from "telnyx";
import express from "express";

const TELNYX_PUBLIC_KEY = process.env.TELNYX_PUBLIC_KEY;
const TELNYX_API_KEY = process.env.TELNYX_API_KEY;
const PORT = process.env.PORT;

const telnyx = new Telnyx(TELNYX_API_KEY || "");

const app = express();
const textEncoder = new TextEncoder();

app.use(express.json());

app.use(function webhookValidator(req, res, next) {
  try {
    telnyx.webhooks.constructEvent(
      JSON.stringify(req.body, null, 2),
      req.header("telnyx-signature-ed25519"),
      req.header("telnyx-timestamp"),
      textEncoder.encode(TELNYX_PUBLIC_KEY)
    );
    next();
  } catch (e) {
    const message = (e as Error).message;
    console.log(`Invalid webhook: ${message}`);
    res.status(400).send(`Webhook Error: ${message}`);
  }
});

app.post("/inbound", async function inboundMessageController(req, res) {
  res.sendStatus(200); // Play nice and respond to webhook
  const event = req.body.data;
  console.log(`Received inbound message with ID: ${event.payload.id}`);
  const dlrUrl = new URL("/outbound", `${req.protocol}://${req.hostname}`).href;
  const toNumber = event.payload.to[0].phone_number;
  const fromNumber = event.payload["from"].phone_number;

  try {
    const messageRequest: Telnyx.MessagesCreateOptionalParams = {
      from: toNumber,
      to: fromNumber,
      text: "👋 Hello World",
      webhook_url: dlrUrl,
      use_profile_webhooks: false,
      auto_detect: false,
    };

    const telnyxResponse = await telnyx.messages.create(messageRequest);
    console.log(`Sent message with id: ${telnyxResponse.data?.id}`);
  } catch (e) {
    console.log("Error sending message");
    console.log(e);
  }
});

app.post("/outbound", async function outboundMessageController(req, res) {
  res.sendStatus(200); // Play nice and respond to webhook
  const event = (req.body as Telnyx.events.OutboundMessageEvent).data!;
  console.log(`Received message DLR with ID: ${event.payload?.id}`);
});

app.listen(PORT);
console.log(`Server listening on port ${PORT}`);
