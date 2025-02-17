<div align="center">

# Telnyx-Node Bridge Calls & Supervisor Demo

![Telnyx](../logo-dark.png)

Sample application demonstrating bridging two call legs and adding a supervisor call using the Telnyx Dial API

</div>

## Documentation & Tutorial

The full Telnyx Dial API documentation is available on [developers.telnyx.com](https://developers.telnyx.com/api/call-control/dial-call).

## Pre-Reqs

You will need to set up:

- [Telnyx Account](https://telnyx.com/sign-up)
- [Telnyx Phone Number](https://portal.telnyx.com/#/app/numbers/my-numbers) with a valid webhook URL configured for your Call Control App
- [Node.js & NPM](https://nodejs.org/en/) installed
- A tunneling service like [ngrok](https://ngrok.com/) to expose your local webhook endpoint
- A public site to host your application

## What You Can Do

- **Bridge Call Legs:** Dial two call legs (Party A and Party B) using the Telnyx Dial API and automatically bridge them once both have answered.
- **Add Supervisor:** Dial a supervisor call with a specified role (barge, monitor, or whisper) to join the active call session.

## Usage

The following environmental variables need to be set:

| Variable                 | Description                                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `TELNYX_API_KEY`         | Your [Telnyx API Key](https://portal.telnyx.com/#/app/api-keys)                                                      |
| `CONNECTION_ID`          | Your Telnyx Call Control App ID (must have a webhook URL configured)                                                 |
| `FROM_NUMBER`            | The phone number (in E.164 format) used as the caller ID for outbound calls                                           |
| `SUPERVISOR_FROM_NUMBER` | (Optional) The phone number used for supervisor calls; defaults to a hard-coded value if not set                        |

### .env File

Create a `.env` file in the project root (or copy [.env.sample](./.env.sample)) and add:

```
TELNYX_API_KEY="YOUR_API_KEY"
CONNECTION_ID="YOUR_CONNECTION_ID"
FROM_NUMBER="+1234567890"
SUPERVISOR_FROM_NUMBER="+0987654321"
```

### Install

Run the following commands to get started:

```
$ git clone https://github.com/team-telnyx/demo-node-telnyx.git
$ cd demo-node-telnyx/supervisor-bridge-no_conference
$ npm install
```

### Ngrok

This application is served on the port defined in the runtime environment (or in the `.env` file). Be sure to launch [ngrok](https://ngrok.com/) for that port:

```
./ngrok http 3000
```

### Run

Start the server:

```
$ node new_conference.js
```

### Webhook URL

Set the webhook URL in your Telnyx Call Control App to the ngrok URL followed by `/webhook`. For example:

```
http://your-url.ngrok.io/webhook
```

### Endpoints

- **Bridge Calls:** `POST /bridge-calls`
  - JSON body: `{ "bridgeANumber": "+1234567890", "bridgeBNumber": "+0987654321" }`
- **Add Supervisor:** `POST /bridge-supervisor`
  - JSON body: `{ "supervisorNumber": "+11234567890", "supervisorRole": "barge" }`

### Accessing the App

To use the app, navigate to the root route `/` in your browser:

```
http://localhost:3000/
```

This will load the web interface where you can enter the phone numbers for Party A and Party B to bridge calls, and also add a supervisor to the call session.


