# Title

⏱ **30 minutes build time || [Github Repo]()**

## Introduction

Telnyx's messaging API supports both MMS and SMS messsages. Inbound multimedia messaging (MMS) messages include an attachment link in the webhook. The link and corresponding media should be treated as ephemeral and you should save any important media to a media storage (such as AWS S3) of your own.

## What you can do

At the end of this tutorial you'll have an application that:

- Receives an inbound message (SMS or MMS)
- Iterates over any media attachments and downloads the remote attachment locally
- Uploads the same attachment to AWS S3
- Sends the attachments back to the same phone number that originally sent the message

## Pre-reqs & technologies

- Completed or familiar with the [Receiving SMS & MMS Quickstart](docs/v2/messaging/quickstarts/receiving-sms-and-mms)
- A working [Messaging Profile](https://portal.telnyx.com/#/app/messaging) with a phone number enabled for SMS & MMS.
- [Node & NPM](https://developers.telnyx.com/docs/v2/development/dev-env-setup?lang=node&utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link) installed
- [Familiarity with Express](https://expressjs.com/)
- Ability to receive webhooks (with something like [ngrok](docs/v2/development/ngrok))
- AWS Account setup with proper profiles and groups with IAM for S3. See the [Quickstart](https://docs.aws.amazon.com/sdk-for-javascript/index.html) for more information.
- Previously created S3 bucket with public permissions available.

## Setup

### Telnyx Portal configuration

Be sure to have a [Messaging Profile](https://portal.telnyx.com/#/app/messaging) with a phone number enabled for SMS & MMS and webhook URL pointing to your service (using ngrok or similar)

### Install packages via NPM

```shell
npm i aws-sdk
npm i axios
npm i dotenv
npm i express
npm i telnyx
```

This will create `package.json` file with the packages needed to run the application.

### Setting environment variables

The following environmental variables need to be set

| Variable               | Description                                                                                                                                              |
| :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TELNYX_API_KEY`       | Your [Telnyx API Key](https://portal.telnyx.com/#/app/api-keys?utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link)              |
| `TELNYX_PUBLIC_KEY`    | Your [Telnyx Public Key](https://portal.telnyx.com/#/app/account/public-key?utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link) |
| `TELNYX_APP_PORT`      | **Defaults to `8000`** The port the app will be served                                                                                                   |
| `AWS_PROFILE`          | Your AWS profile as set in `~/.aws`                                                                                                                      |
| `AWS_REGION`           | The region of your S3 bucket                                                                                                                             |
| `TELNYX_MMS_S3_BUCKET` | The name of the bucket to upload the media attachments                                                                                                   |

### .env file

This app uses the excellent [dotenv](https://github.com/bkeepers/dotenv) package to manage environment variables.

Make a copy of the file below, add your credentials, and save as `.env` in the root directory.

```
TELNYX_API_KEY=
TELNYX_PUBLIC_KEY=
TENYX_APP_PORT=8000
AWS_PROFILE=
AWS_REGION=
TELNYX_MMS_S3_BUCKET=
```

## Code-along

We'll use a few `.ts` files to build the MMS application. `index.ts` as our entry point and `messaging.ts` to contain our routes and controllers for the app.

```shell
touch index.ts
touch messaging.ts
```

### Setup Express Server

```typescript
// In index.ts
import "dotenv/config";

import express from "express";
import * as config from "./config";
import Telnyx from "telnyx";

import messaging from "./messaging";

const app = express();

const telnyx = new Telnyx(config.TELNYX_API_KEY);

app.use(express.json());

app.use("/messaging", messaging);

app.listen(config.TELNYX_APP_PORT);
console.log(`Server listening on port ${config.TELNYX_APP_PORT}`);
```

## Receiving Webhooks

Now that you have setup your auth token, phone number, and connection, you can begin to use the API Library to send/receive SMS & MMS messages. First, you will need to setup an endpoint to receive webhooks for inbound messages & outbound message Delivery Receipts (DLR).

### Basic Routing & Functions

The basic overview of the application is as follows:

1. Verify webhook & create TelnyxEvent
2. Extract information from the webhook
3. Iterate over any media and download/re-upload to S3 for each attachment
4. Send the message back to the phone number from which it came
5. Acknowledge the status update (DLR) of the outbound message

#### Webhook validation middleware

Telnyx signs each webhook that can be validated by checking the signature with your public key. This example adds the verification step as middleware to be included on all Telnyx endpoints. The [Webhooks Doc](docs/api/v2/overview#webhook-signing) elaborates more on how to check the headers and signature.

After declaring the `const app=express();` and before `app.use('/messaging', messaging);` add the following code to validate the webhook in indeed from Telnyx.

```typescript
// in index.ts
const webhookValidator = (req, res, next) => {
  try {
    telnyx.webhooks.constructEvent(
      JSON.stringify(req.body, null, 2),
      req.header("telnyx-signature-ed25519"),
      req.header("telnyx-timestamp"),
      config.TELNYX_PUBLIC_KEY
    );
    next();
    return;
  } catch (e) {
    console.log(`Invalid webhook: ${e.message}`);
    return res.status(400).send(`Webhook Error: ${e.message}`);
  }
};

app.use(webhookValidator);
```

### Media Download & Upload Functions

Before diving into the inbound message handler, first we'll create a few functions to manage our attachments inside the `messaging.ts` file.

- `downloadFile` saves the content from a URL to disk
- `uploadFile` uploads the file passed to AWS S3 (and makes object public)
- Note that this application is demonstrating 2 topics at once, downloading & uploading. It could be improved by piping or streaming the data from Telnyx to S3 instead of saving to disk.

```typescript
// In messaging.ts
import express from "express";
import * as config from "./config";
import fs from "fs";
import axios from "axios";
import AWS from "aws-sdk";
import path from "path";
import Telnyx from "telnyx";

AWS.config.update({ region: config.AWS_REGION });

const telnyx = new Telnyx(config.TELNYX_API_KEY);

const router = express.Router();

const uploadFile = async (filePath: string): Promise<string> => {
  const s3 = new AWS.S3({ apiVersion: "2006-03-01" });
  const bucketName = config.TELNYX_MMS_S3_BUCKET;
  const fileName = path.basename(filePath);
  const fileStream = fs.createReadStream(filePath);
  return new Promise(async (resolve, reject) => {
    fileStream.once("error", reject);
    try {
      const s3UploadParams = {
        Bucket: bucketName,
        Key: fileName,
        Body: fileStream,
        ACL: "public-read",
      };
      await s3.upload(s3UploadParams).promise();
      resolve(`https://${bucketName}.s3.amazonaws.com/${fileName}`);
    } catch (e) {
      reject(e);
    }
  });
};

async function downloadFile(url: string): Promise<string> {
  const fileLocation = path.resolve(
    __dirname,
    url.substring(url.lastIndexOf("/") + 1)
  );
  const response = await axios({
    method: "get",
    url: url,
    responseType: "stream",
  });
  response.data.pipe(fs.createWriteStream(fileLocation));
  return new Promise((resolve, reject) => {
    response.data.on("end", () => {
      resolve(fileLocation);
    });
    response.data.on("error", reject);
  });
}
```

### Inbound Message Handling

Now that we have the functions to manage the media, we can start receiving inbound MMS's

The flow of our function is (at a high level):

1. Extract relevant information from the webhook
2. Build the `webhook_url` to direct the DLR to a new endpoint
3. Iterate over any attachments/media and call our `downloadUpload` function
4. Send the outbound message back to the original sender with the media attachments

```typescript
// In messaging.ts
const inboundMessageController = async (req, res) => {
  res.sendStatus(200); // Play nice and respond to webhook
  const event = req.body.data;
  console.log(`Received inbound message with ID: ${event.payload.id}`);
  const dlrUrl = new URL(
    "/messaging/outbound",
    `${req.protocol}://${req.hostname}`
  ).href;
  const toNumber = event.payload.to[0].phone_number;
  const fromNumber = event.payload["from"].phone_number;
  const medias = event.payload.media;
  const mediaPromises = medias.map(async (media) => {
    const fileName = await downloadFile(media.url);
    return uploadFile(fileName);
  });
  const mediaUrls = await Promise.all(mediaPromises);
  try {
    const messageRequest = {
      from: toNumber,
      to: fromNumber,
      text: "👋 Hello World",
      media_urls: mediaUrls,
      webhook_url: dlrUrl,
      use_profile_webhooks: false,
    };
    const telnyxResponse = await telnyx.messages.create(messageRequest);
    console.log(`Sent message with id: ${telnyxResponse.data.id}`);
  } catch (e) {
    console.log("Error sending message");
    console.log(e);
  }
};
```

### Outbound Message Handling

As we defined our `webhook_url` path to be `/messaging/outbound` we'll need to create a function that accepts a POST request to that path within messaging.ts.

```typescript
// In messaging.ts
const outboundMessageController = async (req, res) => {
  res.sendStatus(200); // Play nice and respond to webhook
  const event = req.body.data;
  console.log(`Received message DLR with ID: ${event.payload.id}`);
};
```

### Decare routes for inbound and outbound messaging

At the bottom of `messaging.ts` add the routes and point to the correct controller function

```typescript
router.route("/inbound").post(inboundMessageController);

router.route("/outbound").post(outboundMessageController);
```

### Final index.ts

All together the index.ts should look something like:

```typescript
import "dotenv/config";

import express from "express";
import * as config from "./config";
import Telnyx from "telnyx";

import messaging from "./messaging";

const app = express();
const textEncoder = new TextEncoder();

const telnyx = new Telnyx(config.TELNYX_API_KEY);

app.use(express.json());

app.use(function webhookValidator(req, res, next) {
  try {
    telnyx.webhooks.constructEvent(
      JSON.stringify(req.body, null, 2),
      req.header("telnyx-signature-ed25519")!,
      req.header("telnyx-timestamp")!,
      textEncoder.encode(config.TELNYX_PUBLIC_KEY),
      300
    );
    next();
  } catch (e) {
    const message = (e as Error).message;
    console.log(`Invalid webhook: ${message}`);
    res.status(400).send(`Webhook Error: ${message}`);
  }
});

app.use("/messaging", messaging);

app.listen(config.TELNYX_APP_PORT);
console.log(`Server listening on port ${config.TELNYX_APP_PORT}`);
```

### Final messaging.ts

```typescript
import express from "express";
import * as config from "./config";
import fs from "fs";
import axios from "axios";
import AWS from "aws-sdk";
import path from "path";
import Telnyx from "telnyx";

AWS.config.update({ region: config.AWS_REGION });

const telnyx = new Telnyx(config.TELNYX_API_KEY);

const router = express.Router();

const uploadFile = async (filePath: string): Promise<string> => {
  const s3 = new AWS.S3({ apiVersion: "2006-03-01" });
  const bucketName = config.TELNYX_MMS_S3_BUCKET;
  const fileName = path.basename(filePath);
  const fileStream = fs.createReadStream(filePath);
  return new Promise(async (resolve, reject) => {
    fileStream.once("error", reject);
    try {
      const s3UploadParams = {
        Bucket: bucketName,
        Key: fileName,
        Body: fileStream,
        ACL: "public-read",
      };
      await s3.upload(s3UploadParams).promise();
      resolve(`https://${bucketName}.s3.amazonaws.com/${fileName}`);
    } catch (e) {
      reject(e);
    }
  });
};

async function downloadFile(url: string): Promise<string> {
  const fileLocation = path.resolve(
    __dirname,
    url.substring(url.lastIndexOf("/") + 1)
  );
  const response = await axios({
    method: "get",
    url: url,
    responseType: "stream",
  });
  response.data.pipe(fs.createWriteStream(fileLocation));
  return new Promise((resolve, reject) => {
    response.data.on("end", () => {
      resolve(fileLocation);
    });
    response.data.on("error", reject);
  });
}

router
  .route("/inbound")
  .post(async function inboundMessageController(req, res) {
    res.sendStatus(200); // Play nice and respond to webhook
    const event = req.body.data;
    console.log(`Received inbound message with ID: ${event.payload.id}`);
    const dlrUrl = new URL(
      "/messaging/outbound",
      `${req.protocol}://${req.hostname}`
    ).href;
    const toNumber = event.payload.to[0].phone_number as string;
    const fromNumber = event.payload["from"].phone_number as string;
    const medias = event.payload.media;
    const mediaPromises: Promise<string>[] = medias.map(
      async (media: { url: string }) => {
        const fileName = await downloadFile(media.url);
        return uploadFile(fileName);
      }
    );
    const mediaUrls = await Promise.all(mediaPromises);
    try {
      const messageRequest: Telnyx.MessagesCreateOptionalParams = {
        from: toNumber,
        to: fromNumber,
        text: "👋 Hello World",
        media_urls: mediaUrls,
        webhook_url: dlrUrl,
        use_profile_webhooks: false,
        auto_detect: false,
      };

      const telnyxResponse = await telnyx.messages.create(messageRequest);
      console.log(`Sent message with id: ${telnyxResponse.data!.id}`);
    } catch (e) {
      console.log("Error sending message");
      console.log(e);
    }
  });

router
  .route("/outbound")
  .post(async function outboundMessageController(req, res) {
    res.sendStatus(200); // Play nice and respond to webhook
    const event = req.body.data;
    console.log(`Received message DLR with ID: ${event.payload.id}`);
  });

export default router;
```

## Usage

Start the server `npm run server`

When you are able to run the server locally, the final step involves making your application accessible from the internet. So far, we've set up a local web server. This is typically not accessible from the public internet, making testing inbound requests to web applications difficult.

The best workaround is a tunneling service. They come with client software that runs on your computer and opens an outgoing permanent connection to a publicly available server in a data center. Then, they assign a public URL (typically on a random or custom subdomain) on that server to your account. The public server acts as a proxy that accepts incoming connections to your URL, forwards (tunnels) them through the already established connection and sends them to the local web server as if they originated from the same machine. The most popular tunneling tool is `ngrok`. Check out the [ngrok setup](/docs/v2/development/ngrok) walkthrough to set it up on your computer and start receiving webhooks from inbound messages to your newly created application.

Once you've set up `ngrok` or another tunneling service you can add the public proxy URL to your Inbound Settings in the Mission Control Portal. To do this, click the edit symbol [✎] next to your Messaging Profile. In the "Inbound Settings" > "Webhook URL" field, paste the forwarding address from ngrok into the Webhook URL field. Add `messaging/inbound` to the end of the URL to direct the request to the webhook endpoint in your server.

For now you'll leave “Failover URL” blank, but if you'd like to have Telnyx resend the webhook in the case where sending to the Webhook URL fails, you can specify an alternate address in this field.

Once everything is setup, you should now be able to:

- Text your phone number and receive a response!
- Send a picture to your phone number and get that same picture right back!
