<div align="center">

# Telnyx-Node Simple Call Control Application

![Telnyx](../logo-dark.png)

Sample application demonstrating Telnyx-Node Call Control functionality.

</div>

## Pre-Reqs

You will need to set up:

- [Telnyx Account](https://telnyx.com/sign-up?utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link)
- [Telnyx Phone Number](https://portal.telnyx.com/#/app/numbers/my-numbers) enabled with:
  - [Telnyx Call Control Application](https://portal.telnyx.com/#/app/call-control/applications)
  - [Telnyx Outbound Voice Profile](https://portal.telnyx.com/#/app/outbound-profiles)
- [Node & NPM](https://developers.telnyx.com/docs/v2/development/dev-env-setup?lang=node&utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link) installed

## What you can do

This app, when running has the following behavior for inbound and outbound calls:

Inbound:

- Receives inbound callback
- Answers the call
- Speaks a sentence and waits for speak.ended callback
- Ends the call

Outbound:

- Makes the call to the specified number
- On answer, speaks audio
- Waits for speak.ended callback
- Ends the call

## Usage

The following environmental variables need to be set

| Variable               | Description                                                                                                                                 |
| :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| `TELNYX_API_KEY`       | Your [Telnyx API Key](https://portal.telnyx.com/#/app/api-keys?utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link) |
| `TELNYX_NUMBER`        | Your [Telnyx Phone Number](https://portal.telnyx.com/#/app/numbers/my-numbers)                                                              |
| `TELNYX_CONNECTION_ID` | Your [Telnyx Call Control Application ID](https://portal.telnyx.com/#/app/call-control/applications)                                        |
| `TELNYX_APP_PORT`      | **Defaults to `8000`** The port the app will be served.                                                                                     |

### .env file

This app uses the excellent [dotenv](https://github.com/motdotla/dotenv) package to manage environment variables.

Make a copy of [`.env.sample`](./.env.sample) and save as `.env` and update the variables to match your creds.

```
TELNYX_API_KEY=""
TELNYX_NUMBER=""
TELNYX_CONNECTION_ID=""
TELNYX_APP_PORT=8000
```

### Ngrok

This application is served on the port defined in the runtime environment (or in the `.env` file). Be sure to launch [ngrok](https://developers.telnyx.com/docs/v2/development/ngrok?utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link) for that port

```
./ngrok http 8000
```

> Terminal should look _something_ like

```
ngrok by @inconshreveable                                                                                                                               (Ctrl+C to quit)

Session Status                online
Account                       Little Bobby Tables (Plan: Free)
Version                       2.3.35
Region                        United States (us)
Web Interface                 http://127.0.0.1:4040
Forwarding                    http://your-url.ngrok.io -> http://localhost:8000
Forwarding                    https://your-url.ngrok.io -> http://localhost:8000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

At this point you can point your [Call Control Application](https://portal.telnyx.com/#/app/call-control/applications) webhook url to generated ngrok URL + path. For this example, the url will be `http://{your-url}.ngrok.io/call_control`

### Install

Run the following commands to get started

```
$ git clone https://github.com/d-telnyx/demo-node-telnyx.git
```

### Run

Start the server `npm run start`

When the application is started, express serves it to the port specified in the .env file (Default 8000), so you can sipmly take a look at the application at localhost:8000.

**Note: You must enter phone number in E.164 format (i.e. +12345678910) for the call to be sent correctly.**

Once everything is setup, you should now be able to:

- Make calls to a specified outbound number
- Receive an inbound call
