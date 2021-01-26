<div align="center">

# Telnyx-Node Call-Tracking Example

![Telnyx](../logo-dark.png)

Sample application demonstrating Telnyx-Node Call Tracking

</div>

## Documentation & Tutorial

The full API documentation and tutorial is available on [developers.telnyx.com](https://developers.telnyx.com)

## Pre-Reqs

You will need to set up:

* [Telnyx Account](https://telnyx.com/sign-up)
* [Call-Control Application](https://portal.telnyx.com/#/app/call-control/applications)
  * [Outbound Voice Profile](https://portal.telnyx.com/#/app/outbound-profiles)
* Ability to receive webhooks (with something like [ngrok](https://developers.telnyx.com/docs/v2/development/ngrok)

## Introduction

Telnyx's [Phone Numbers API](https://developers.telnyx.com/docs/v2/numbers) combined with [Call-Control](https://developers.telnyx.com/docs/v2/call-control) provides the tools and features to build a robust call tracking appliction.

The [Phone Numbers API](https://developers.telnyx.com/docs/v2/numbers) enables you to search Telnyx's phone number inventory in real time; filtering by Area Code, City/State, and more to find the perfect local number for your use-case.

The [Call-Control API](https://developers.telnyx.com/docs/v2/numbers) enables you to quickly setup dynamic forwarding numbers, toggle dual-channel recording, join/leave dynamic conferences, and pull post-call analytics.

### What you can do

This application demonstrates:

* Searching and ordering a phone number by area code
* Storing a 'bind' of Telnyx phone number to 'business number' (where to forward calls)
* Receiving inbound calls to the Telnyx phone number
* Transferring calls via call-control
* Storing webhook events to a datastore

## Setup

### Telnyx Portal configuration

Be sure to have a [Call-Control Application](https://portal.telnyx.com/#/app/call-control/applications) with an [Outbound Voice Profile](https://portal.telnyx.com/#/app/outbound-profiles) configured and connected to the call-control application.

### Initialize and Install packages via NPM

Initialize your call-tracking application with the defaults presented to you.

```shell
mkdir call-tracking
cd call-tracking
npm init
```

Then install the necessary packages for the call-tracking application

```shell
npm i dotenv
npm i express
npm i telnyx
```

This will create `package.json` file with the packages needed to run the application.

### Setting environment variables

The following environmental variables need to be set

| Variable               | Description                                                                                   |
|:-----------------------|:----------------------------------------------------------------------------------------------|
| `TELNYX_API_KEY`       | Your [Telnyx API Key](https://portal.telnyx.com/#/app/api-keys)                               |
| `TELNYX_PUBLIC_KEY`    | Your [Telnyx Public Key](https://portal.telnyx.com/#/app/account/public-kek)                  |
| `TELNYX_CONNECTION_ID` | Your [Call-Control Application](https://portal.telnyx.com/#/app/call-control/applications) id |
| `PORT`                 | **Defaults to `8000`** The port the app will be served                                        |


### .env file

This app uses the excellent [dotenv](https://github.com/bkeepers/dotenv) package to manage environment variables.

Make a copy of the file below, add your credentials, and save as `.env` in the root directory.

```
TELNYX_PUBLIC_KEY=
TELNYX_API_KEY=
TELNYX_CONNECTION_ID=
PORT=8000
```

## Code-along

We'll use a few `.js` files to build the call-tracking application.

* `index.js` as our entry point to the application
* `db.js` for our database controller (in-memory DB for sample)
* `callControl.js` to manage call-control webhooks
* `bindings.js` to manage call-tracking bindings and post-call metadata

```
touch index.js
touch db.js
touch callControl.js
touch bindings.js
```

### Setup Express Server

The `index.js` file sets up 2 express routes:

* `/call-control` : To handle call-control webhooks
* `/bindings` : To manage phone number bindings and call information

```js
// In index.js
require('dotenv').config()

const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

const callControlPath = '/call-control';
const callControl = require('./callControl');
app.use(callControlPath, callControl);

const bindingsPath = '/bindings'
const bindings = require('./bindings');
app.use(bindingsPath, bindings);

app.listen(process.env.TELNYX_APP_PORT);
console.log(`Server listening on port ${process.env.TELNYX_APP_PORT}`);
```

### Setup "Database"

The `db.js` file contains the in-memory database to manage our phone numbers and call information. It exports 1 array and 3 functions:

* `bindings = []` : Our in-memory database
* `addPhoneNumberBinding` : accepts a Telnyx phone number and a destination number to save to the database.
  * Called when ordering / creating a new call-tracking number
* `getDestinationPhoneNumber` : accepts a Telnyx phone number and searches the database for a match, then returns the destination phone number.
  * Called when receiving an inbound call to look up transfer destination.
* `saveCall` : accepts a Telnyx event and saves the call to the database based on the payload.
  * Called when the `call.hangup` event is received to save post-call information
* `getBinding`: accepts a Telnyx phone number and returns the matching binding information from the database.
  * Called when `GET` bindings has a telnyxPhoneNumber query parameter

```js
// in db.js
const bindings = [];
module.exports.bindings = bindings;

module.exports.addPhoneNumberBinding = (telnyxPhoneNumber, destinationPhoneNumber) => {
  const index = bindings.findIndex(binding => binding.telnyxPhoneNumber === telnyxPhoneNumber);
  if (index > 0) {
    return {
      ok: false,
      message: `Binding of Telnyx: ${telnyxPhoneNumber} already exists`,
      binding: bindings[index]
    }
  }
  const binding = {
    telnyxPhoneNumber,
    destinationPhoneNumber,
    calls: []
  }
  bindings.push(binding);
  return { ok: true }
};

module.exports.getDestinationPhoneNumber = telnyxPhoneNumber => {
  const destinationPhoneNumber = bindings
    .filter(binding => binding.telnyxPhoneNumber === telnyxPhoneNumber)
    .reduce((a, binding) => binding.destinationPhoneNumber, '');
  return destinationPhoneNumber;
};

module.exports.saveCall = callWebhook => {
  const telnyxPhoneNumber = callWebhook.payload.to;
  const index = bindings.findIndex(
      binding => binding.telnyxPhoneNumber === telnyxPhoneNumber);
  bindings[index].calls.push(callWebhook);
};

module.exports.getBinding = telnyxPhoneNumber => {
  return bindings.filter(
      binding => binding.telnyxPhoneNumber === telnyxPhoneNumber);
};

```

### Managing Bindings

The `bindings.js` file contains all the logic for:

* [Searching Phone Numbers](https://developers.telnyx.com/docs/api/v2/numbers/Number-Search) by area code (also known as `national_destination_code`)
* [Ordering Phone Numbers](https://developers.telnyx.com/docs/api/v2/numbers/Number-Orders) and setting the `connection_id` as part of the order
* Saving the binding to the database
* Routes for fetching binding information

```js
// in bindings.js
const express = require('express');
const telnyx = require('telnyx')(process.env.TELNYX_API_KEY);
const router = module.exports = express.Router();
const db = require('./db');
const CONNECTION_ID = process.env.TELNYX_CONNECTION_ID;

const searchNumbers = async (req, res, next) => {
  const isInvalidRequest = (!req.body.areaCode || !req.body.destinationPhoneNumber || req.body.areaCode.length !== 3)
  if (isInvalidRequest) {
    res.send({
      message: 'Invalid search criteria, please send 3 digit areaCode',
      example: '{ "areaCode": "919", "destinationPhoneNumber": "+19198675309" }'
    });
    return;
  }
  try {
    const areaCode = req.body.areaCode;
    const availableNumbers = await telnyx.availablePhoneNumbers.list({
      filter: {
        national_destination_code: areaCode,
        features: ["sms", "voice", "mms"],
        limit: 1
      }
    });
    const phoneNumber = availableNumbers.data.reduce((a, e) => e.phone_number, '');
    if (!phoneNumber) {
      res.send({message: 'No available phone numbers'}).status(200);
    } else {
      res.locals.phoneNumber = phoneNumber;
      next();
    }
  } catch (e) {
    const message = ''
    console.log(message);
    console.log(e);
    res.send({message}, ...e).status(400);
  }
}

const orderNumber = async (req, res, next) => {
  try {
    const phoneNumber = res.locals.phoneNumber;
    const result = await telnyx.numberOrders.create({
      connection_id: CONNECTION_ID,
      phone_numbers: [{
        phone_number: phoneNumber
      }]
    });
    res.locals.phoneNumberOrder = result.data;
    next();
  } catch (e) {
    const message = `Error ordering number: ${res.locals.phoneNumber}`
    console.log(message);
    console.log(e);
    res.send({message}, ...e).status(400);
  }
}

const saveBinding = async (req, res) => {
  try {
    const telnyxPhoneNumber = res.locals.phoneNumber;
    const destinationPhoneNumber = req.body.destinationPhoneNumber;
    db.addPhoneNumberBinding(telnyxPhoneNumber, destinationPhoneNumber);
    res.send(res.locals.phoneNumberOrder);
  } catch (e) {
    res.send(e).status(409);
  }
}

const getBindings = async (req, res) => {
  if (req.query.telnyxPhoneNumber) {
    const telnyxPhoneNumber = req.query.telnyxPhoneNumber;
    const binding = db.getBinding(telnyxPhoneNumber);
    res.send(binding).status(200);
  } else {
    res.send(db.bindings);
  }
}

router.route('/')
.post(searchNumbers, orderNumber, saveBinding)
.get(getBindings);
```

### Managing Call-Control

The `callControl.js` file contains the routes and functions for:

* Receiving inbound call webhooks
* [Answering the inbound call](https://developers.telnyx.com/docs/api/v2/call-control/Call-Commands#callAnswer)
* [Transferring the call](https://developers.telnyx.com/docs/api/v2/call-control/Call-Commands#callTransfer) to the destination number saved in the database
* Saving the [hangup event](https://developers.telnyx.com/docs/api/v2/call-control/Call-Commands#callHangup) to the database

```js
// in callControl.js
const express = require('express');
const telnyx = require('telnyx')(process.env.TELNYX_API_KEY);
const router = module.exports = express.Router();
const db = require('./db');

const outboundCallController = async (req, res) => {
  res.sendStatus(200); // Play nice and respond to webhook
  const event = req.body.data;
  const callIds = {
    call_control_id: event.payload.call_control_id,
    call_session_id: event.payload.call_session_id,
    call_leg_id: event.payload.call_leg_id
  }
  console.log(`Received Call-Control event: ${event.event_type} DLR with call_session_id: ${callIds.call_session_id}`);
}

const handleInboundAnswer = async (call, event, req) => {
  console.log(`call_session_id: ${call.call_session_id}; event_type: ${event.event_type}`);
  try {
    const webhook_url = (new URL('/call-control/outbound', `${req.protocol}://${req.hostname}`)).href;
    const destinationPhoneNumber = db.getDestinationPhoneNumber(event.payload.to);
    await call.transfer({
      to: destinationPhoneNumber,
      webhook_url
    })
  } catch (e) {
    console.log(`Error transferring on call_session_id: ${call.call_session_id}`);
    console.log(e);
  }
}

const handleInboundHangup = (call, event) => {
  console.log(`call_session_id: ${call.call_session_id}; event_type: ${event.event_type}`);
  db.saveCall(event);
}

const inboundCallController = async (req, res) => {
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
    case 'call.answered':
      await handleInboundAnswer(call, event, req);
      break;
    case 'call.hangup':
      handleInboundHangup(call, event);
      break;
    default:
      console.log(`Received Call-Control event: ${event.event_type} DLR with call_session_id: ${call.call_session_id}`);
  }
}

router.route('/outbound')
.post(outboundCallController);

router.route('/inbound')
.post(inboundCallController);
```

## Running the application

Now that you've saved all the examples and built your routes, it's time to run the application.

### Launch ngrok (or other service) and update your Call-Control Application

We need to be able to receive webhooks from Telnyx, sent over the public Internet. We'll use [ngrok](https://developers.telnyx.com/docs/v2/development/ngrok) for this tutorial.

> Launch ngrok to the PORT specified in your .ENV file

```
$ ./ngrok http 8000

ngrok by @inconshreveable

Session Status                online
Account                       Little Bobby Tables (Plan: Free)
Version                       2.x.x
Region                        United States (us)
Web Interface                 http://127.0.0.1:4040
Forwarding                    http://ead8b6b4.ngrok.io -> localhost:8000
Forwarding                    https://ead8b6b4.ngrok.io -> localhost:8000

Connections                   ttl     opn     rt1.   rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

Once you've set up `ngrok` or another tunneling service you can add the public proxy URL to your Inbound Settings  in the Mission Control Portal.

To do this, click  the edit symbol [✎] next to your [Call-Control Application](https://portal.telnyx.com/#/app/call-control/applications)

In the "App Info" > "Send a webhook to the URL:(Required)" field, paste the forwarding address from ngrok into the Webhook URL field. Add `/call-control/inbound` to the end of the URL to direct the request to the webhook endpoint in your server.

In this example the URL will be `http://ead8b6b4.ngrok.io/call-control/inbound`.

### Run the Node.JS Application

Start the server `node index.js`

Once everything is setup, you should now be able to:
* Allocate a new call-tracking number and bind it to a forwarding number
* Call the allocated number and get connected to the destination.

### Create a binding

The Bindings interface is managed through a RESTFUL API.

To create a new binding create a POST request to your ngrok URL (in this example: `http://ead8b6b4.ngrok.io/bindings`)

The POST request accepts a JSON object structured like:

* `areaCode`: Desired area code for the new call tracking phone number
* `destinationPhoneNumber` : Number which we'll forward all incoming calls to the call-tracking phone number

```http
POST http://ead8b6b4.ngrok.io/bindings HTTP/1.1
Content-Type: application/json; charset=utf-8

{
  "areaCode" : "919",
  "destinationPhoneNumber": "+19198675309"
}
```

The application will search Telnyx's Inventory for a phone number matching the areaCode passed and will order the first result returned from the API.  It then creates the binding so that any inbound call to the Telnyx phone number is forwarded to the destination phone number.

### List bindings (and call information)

The bindings endpoint supports a `GET` request to pull call information and existing bindings.

The bindings object returns a `calls` array with the hangup webhooks saved. The length of the array equals the number of calls the call-tracking number received. The duration for each call can be calculated as the difference between the `start_time` and `end_time` values.

```http
GET http://ead8b6b4.ngrok.io/bindings HTTP/1.1

HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "telnyxPhoneNumber": "+19193234088",
    "destinationPhoneNumber": "+19198675309",
    "calls": [
      {
        "event_type": "call.hangup",
        "id": "cddecb2a-bb3c-4e90-8e85-e1b6d51a901b",
        "occurred_at": "2021-01-26T16:00:55.413407Z",
        "payload": {
            "call_control_id": "v2:GegDKN9TMwSPYwUALiLrqNd-TpfER6QgvvNg49reRPtz6mhrhBiTTg",
            "call_leg_id": "a704d6e6-5fef-11eb-9e5f-02420a0f7568",
            "call_session_id": "a704df56-5fef-11eb-9718-02420a0f7568",
            "client_state": null,
            "connection_id": "1557657082730120568",
            "end_time": "2021-01-26T16:00:55.413407Z",
            "from": "+14154886792",
            "hangup_cause": "normal_clearing",
            "hangup_source": "caller",
            "sip_hangup_cause": "200",
            "start_time": "2021-01-26T16:00:46.873401Z",
            "to": "+19193234088"
          },
          "record_type": "event"
      }
    ]
  }
]
```
