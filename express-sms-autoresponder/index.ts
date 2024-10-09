import "dotenv/config";
import Telnyx from "telnyx";
import express from "express";

const telnyx = new Telnyx(String(process.env.TELNYX_API_KEY || ""));
const app = express();
const port = 5000;

app.use(express.json());

const preparedReplies = new Map([
  ["pizza", "Chicago pizza is the best"],
  ["ice cream", "I prefer gelato"],
]);
const defaultReply =
  "Please send either the word 'pizza' or 'ice cream' for a different response";

const processWebhook = (webhookBody: Telnyx.events.InboundMessageEvent) => {
  const eventType = webhookBody.data?.event_type;
  const payload = webhookBody.data?.payload;
  const direction = payload?.direction;

  if (eventType === "message.received" && direction === "inbound" && payload) {
    const smsMessage = payload.text?.replace(/\s+/g, " ").trim().toLowerCase();
    const replyToTN = payload.from?.phone_number!;
    const telnyxSMSNumber = payload.to?.at(0)?.phone_number;
    const preparedReply = preparedReplies.get(smsMessage!) || defaultReply;

    return telnyx.messages.create({
      from: telnyxSMSNumber,
      to: replyToTN,
      text: preparedReply,
      use_profile_webhooks: false,
      auto_detect: false,
    });
  }
};

app.post("/webhooks", async (req, res) => {
  try {
    console.log(req.body);
    const result = await processWebhook(req.body);
    console.log(result);
  } catch (e) {
    console.log(e);
  } finally {
    res.status(200).end();
  }
});

app.listen(port, () => {
  console.log(
    `Telnyx SMS autoresponder quickstart app is listening at http://localhost:${port}`
  );
});
