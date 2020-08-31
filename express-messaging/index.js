require('dotenv').config()

const express = require('express');
const config = require('./config');
const telnyx = require('telnyx')(config.TELNYX_API_KEY);

const messaging = require('./messaging');

const app = express();

const webhookValidator = (req, res, next) => {
  try {
    telnyx.webhooks.constructEvent(
      JSON.stringify(req.body, null, 2),
      req.header('telnyx-signature-ed25519'),
      req.header('telnyx-timestamp'),
      config.TELNYX_PUBLIC_KEY
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

app.use('/messaging', messaging);

app.listen(config.TELNYX_APP_PORT);
console.log(`Server listening on port ${config.TELNYX_APP_PORT}`);