<div align="center">

# Telnyx-Node Deepgram Transcription Demo

![Telnyx](../../logo-dark.png)

Sample application demonstrating Telnyx-Node Deepgram Transcription

</div>

## Pre-Reqs

You will need to set up:

* [Telnyx Account](https://telnyx.com/sign-up?utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link)
* [Telnyx Phone Number](https://portal.telnyx.com/#/app/numbers/my-numbers?utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link) enabled with:
* [Telnyx Call Control Application](https://portal.telnyx.com/#/app/call-control/applications?utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link)
* [Telnyx Outbound Voice Profile](https://portal.telnyx.com/#/app/outbound-profiles?utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link)
* Ability to receive audio stream (with something like [ngrok](https://developers.telnyx.com/docs/v2/development/ngrok?utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link))
* [Node & NPM](https://developers.telnyx.com/docs/v2/development/dev-env-setup?lang=node&utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link) installed
* [Deegram Account and API Key](https://console.deepgram.com/signup?jump=keys)
* [Postman Account](https://www.postman.com/postman-account/)

## What you can do

* Create an outbound call to your phone number (when running the app or using postman) with the stream url pointing to your application
* If you answer, your single-channel audio will be transcribed to the console

## Usage

The following environmental variables need to be set

| Variable               | Description                                                                                                                                              |
|:-----------------------|:---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `TELNYX_API_KEY`       | Your [Telnyx API Key](https://portal.telnyx.com/#/app/api-keys)                                                                                          |
| `DEEPGRAM_API_KEY`     | Your [Deepgram API Key](https://console.deepgram.com/signup?jump=keys)                                                                                   |
| `HOST_PORT`            | **Defaults to `9000`** The port the app will be served                                                                                                   |
| `CONNECTION_ID`        | The ID of the [call-control-connection](https://portal.telnyx.com/#/app/call-control/applications) to use for placing the calls                          |
| `TO_NUMBER`            | The number to place your outbound call to                                                                                                                |
| `FROM_NUMBER`          | A Telnyx number to place your call from                                                                                                                  |
| `SOCKET_URL`           | Your **NGROK DOMAIN** like `"ws://your-url.ngrok.io"`                                                                                                    |

### Call Control Application

In the [Mission Control Portal](https://portal.telnyx.com/) you will need to create a Call Control Application. This can be done by navigating to the `Call Control` tab in the portal and clicking `Add New App`.

You can specify the name for the application, but no specific webhook addresses need to be set up for this application to work. Instead you can use a webhook capturing service such as
[HookBin](https://hookbin.com/) to simply see the webhook events as they come in. 

After creating the application, you can click on it to view the `Connection ID` which you will input into your `.env` file.

### .env file

This app uses the excellent [dotenv](https://github.com/motdotla/dotenv) package to manage environment variables.

Make a copy of [`.env.sample`](./.env.sample) and save as `.env` and update the variables to match your creds.

```
TELNYX_API_KEY=KEYasdf
DEEPGRAM_API_KEY=xxxx
HOST_PORT=9000
CONNECTION_ID=1494404757140276705
TO_NUMBER=+15552345678
FROM_NUMBER=+15551234567
SOCKET_URL=ws://your-url.ngrok.io

```

### Install

Run the following commands to get started

```
$ git clone https://github.com/team-telnyx/demo-node-telnyx.git
```

### Ngrok

This application is served on the port defined in the runtime environment (or in the `.env` file). Be sure to launch [ngrok](https://developers.telnyx.com/docs/v2/development/ngrok?utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link) for that port

```
./ngrok http 9000
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

### Run

After setting up `ngrok` or another tunneling service, you will need to copy the Forwarding URL and paste it into your `.env` file. You will also need to ensure the prefix before the URL is `ws` or `wss`, rather than `http` or `https`. It should look something like: `"ws://your-url.ngrok.io"`.

Start the server `npm run start`

This will automatically place an outbound call to your specified TO_NUMBER. Upon answering you should receive transcription of that channel's audio to the console.

#### Create calls using Curl

The service exposes a path at `ws://your-url.ngrok.io/calls` to accept an audio stream to a websocket. After initially running the application and hanging up the call, you can either stop (`Ctrl+C`) and restart the program with the same command (`npm run start`) or place a new dial request. 

```bash
curl --location --request POST 'https://api.telnyx.com/v2/calls' \
--header 'Authorization: Bearer KEYxxxx' \
--header 'Content-Type: application/json' \
--data-raw '{
    "to":"+15552345678",
    "from":"+15551234567",
    "connection_id":"1494404757140276705",
    "stream_url":"ws://your-url.ngrok.io"
}'
```

