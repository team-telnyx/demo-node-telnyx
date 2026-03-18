<div align="center">

# Telnyx-Node Warm Transfer with Supervisor Barge

![Telnyx](../logo-dark.png)

Sample application demonstrating warm call transfers with supervisor barge/whisper/monitor using the Telnyx Call Control API.

</div>

## Documentation & Tutorial

The full Telnyx Call Control API documentation is available on [developers.telnyx.com](https://developers.telnyx.com/api/call-control).

## Pre-Reqs

You will need to set up:

- [Telnyx Account](https://telnyx.com/sign-up)
- [Telnyx Phone Number](https://portal.telnyx.com/#/app/numbers/my-numbers) enabled with:
  - [Telnyx Call Control Application](https://portal.telnyx.com/#/app/call-control/applications)
  - [Telnyx Outbound Voice Profile](https://portal.telnyx.com/#/app/outbound-profiles)
- [Node.js & NPM](https://nodejs.org/en/) installed
- A tunneling service like [ngrok](https://ngrok.com/) or a public domain to expose your webhook endpoint
- SSL certificates for HTTPS

## What You Can Do

- **Auto-Answer & Bridge:** Incoming PSTN calls are automatically answered and bridged to a configurable agent destination (phone number or SIP URI).
- **Real-Time Dashboard:** A web dashboard powered by Server-Sent Events shows active calls with three-leg visibility (PSTN, Agent, Supervisor).
- **Supervisor Barge:** Dial a supervisor into any active call who can speak to both the caller and the agent.
- **Supervisor Whisper:** Dial a supervisor who can speak only to the agent (caller cannot hear).
- **Supervisor Monitor:** Dial a supervisor who listens silently to the call.
- **Dynamic Agent Destination:** Update the agent phone number or SIP URI from the dashboard at any time.

## Usage

The following environmental variables need to be set:

| Variable               | Description                                                                                        |
| :--------------------- | :------------------------------------------------------------------------------------------------- |
| `TELNYX_API_KEY`       | Your [Telnyx API Key](https://portal.telnyx.com/#/app/api-keys)                                    |
| `TELNYX_CONNECTION_ID` | Your [Telnyx Call Control Application ID](https://portal.telnyx.com/#/app/call-control/applications)|
| `TELNYX_PHONE_NUMBER`  | Your [Telnyx Phone Number](https://portal.telnyx.com/#/app/numbers/my-numbers) in E.164 format     |
| `AGENT_PHONE_NUMBER`   | Default agent destination — phone number or SIP URI (e.g. `sip:agent@sip.telnyx.com`)              |
| `PORT`                 | **Defaults to `3000`** The port the app will be served on                                          |

### .env File

This app uses the [dotenv](https://github.com/motdotla/dotenv) package to manage environment variables.

Make a copy of [`.env.example`](./.env.example) and save as `.env` and update the variables to match your creds.

```
TELNYX_API_KEY="YOUR_API_KEY"
TELNYX_CONNECTION_ID="YOUR_CONNECTION_ID"
TELNYX_PHONE_NUMBER="+15551234567"
AGENT_PHONE_NUMBER="sip:agent@sip.telnyx.com"
PORT=3000
```

### SSL Configuration

The server runs over HTTPS. Update the certificate paths in `index.js` to match your environment:

```js
const sslOptions = {
  key: fs.readFileSync('/path/to/privkey.pem'),
  cert: fs.readFileSync('/path/to/fullchain.pem'),
};
```

### Install

Run the following commands to get started:

```
$ git clone https://github.com/team-telnyx/demo-node-telnyx.git
$ cd demo-node-telnyx/warm-transfer-supervisor-barge
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
$ npm start
```

For development with auto-reload:

```
$ npm run dev
```

### Webhook URL

Set the webhook URL in your Telnyx Call Control App to your public URL followed by `/webhooks`. For example:

```
https://your-url.ngrok.io/webhooks
```

### Endpoints

| Method | Path                     | Description                          |
| :----- | :----------------------- | :----------------------------------- |
| `POST` | `/webhooks`              | Telnyx webhook receiver              |
| `GET`  | `/api/agent-destination` | Get current agent destination        |
| `PUT`  | `/api/agent-destination` | Update agent destination             |
| `GET`  | `/api/calls`             | List active call sessions            |
| `GET`  | `/api/events`            | SSE stream of real-time call updates |
| `POST` | `/api/dial-third-party`  | Dial a supervisor into an active call|

### Accessing the App

Navigate to the root route in your browser:

```
https://localhost:3000/
```

This will load the web dashboard where you can:

1. Update the agent destination
2. View active calls in real-time
3. Attach a supervisor to any bridged call with a selectable role (barge, whisper, or monitor)
