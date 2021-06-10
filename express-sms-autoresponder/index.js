require('dotenv').config();
const telnyxApiKey = process.env.TELNYX_API_KEY;
const telnyx = require('telnyx')(telnyxApiKey);

const express = require('express');
const app = express();
const port = 5000;
app.use(express.json());

const preparedReplies = new Map([
  ['pizza', 'Chicago pizza is the best'],
  ['ice cream', 'I prefer gelato']
]);
const defaultReply = "Please send either the word 'pizza' or 'ice cream' for a different response";

const processWebhook = (webhookBody) => {
  const eventType = webhookBody['data']['event_type'];
  const payload = webhookBody['data']['payload'];
  const direction = payload['direction'];

  if (eventType === 'message.received' && direction === 'inbound') {
    const smsMessage = payload['text'].replace(/\s+/g, ' ').trim().toLowerCase();
    const replyToTN = payload['from']['phone_number'];
    const telnyxSMSNumber = payload['to'][0]['phone_number'];
    const preparedReply = preparedReplies.get(smsMessage) || defaultReply;

    return telnyx.messages.create({
      'from': telnyxSMSNumber,
      'to': replyToTN,
      'text': preparedReply
    });
  }
};

app.post('/webhooks', async (req, res) => {
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
  console.log(`Telnyx SMS autoresponder quickstart app is listening at http://localhost:${port}`);
});
