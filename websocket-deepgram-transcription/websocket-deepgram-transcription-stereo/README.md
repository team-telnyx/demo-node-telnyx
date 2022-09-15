<div align="center">

# Telnyx-Node Deepgram Stereo Transcription Demo

![Telnyx](../../logo-dark.png)

Sample application demonstrating Telnyx-Node Deepgram Stereo (Multi-Channel) Transcription

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

* Place a call to your Telnyx phone number configured to a TexML application, the call will be transferred to the specified end number while streaming the audio to your Node application
* If the end number answers the call, audio will be transcribed to the console, separated by the channel that the audio comes in on

## Usage

The following environmental variables need to be set

| Variable               | Description                                                                                                                                              |
|:-----------------------|:---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `DEEPGRAM_API_KEY`     | Your [Deepgram API Key](https://console.deepgram.com/signup?jump=keys)                                                                                   |
| `HOST_PORT`            | **Defaults to `9000`** The port the app will be served                                                                                                   |

### TeXML Application

In the [Mission Control Portal](https://portal.telnyx.com/) you will need to create a TeXML Call Control Application. This can be done by navigating to the `Call Control` tab in the portal and then going to the `TeXML Bin` sub-tab.

You can specify the name for the application, and it will automatically generate a URL. Then you can paste in this XML in the box labeled `Content`:

```
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Start>
    <Stream url="wss://yourdomain.com/stream" track="both_tracks" />
  </Start>
  <Dial>
    <Number>YOUR_PHONE_NUMBER</Number>
  </Dial>
</Response>
```

You will need to replace the Stream URL with your ngrok URL, from the next steps. Additionally, you will need to populate a value for YOUR_PHONE_NUMBER that the call will be forwarded to.

Before saving the new TexML Bin, be sure to copy the value populated in `URL`, as it will be needed to set up your TeXML Application.

After saving the TexML Bin, you will need to create a new TexML Application. You first navigate to the `TeXML Application` sub-tab, and click `Add new TeXML App`. From here you will give your application a name, and paste in your TexML Bin URL in the field labeled `Send a TeXML webhook to the URL`. Lastly you need to configure an Outbound Voice Profile in the Outbound Settings. The steps for creating an outbound voice profile can be found [here](https://developers.telnyx.com/docs/v2/call-control/quickstart#step-3-create-an-outbound-voice-profile). No other settings need to be modified, and you can save your TeXML Application.

Once you have created and saved your TeXML Application, it needs to be assigned to a number, which can be done by navigating to the `Numbers` tab and selecting your application from the dropdown for `Connection or App`.

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

### .env file

This app uses the excellent [dotenv](https://github.com/motdotla/dotenv) package to manage environment variables.

Make a copy of [`.env.sample`](./.env.sample) and save as `.env` and update the variables to match your creds.

```
DEEPGRAM_API_KEY=xxxx
HOST_PORT=9000

```

### Run

After setting up `ngrok` or another tunneling service, you will need to copy the Forwarding URL and paste it into your `.env` file. You will also need to ensure the prefix before the URL is `ws` or `wss`, rather than `http` or `https`. It should look something like: `"ws://your-url.ngrok.io"`.

Start the transcription server `npm run start`

#### Create and bridge the calls

To begin transcription, place a call using a mobile phone or the Telnyx `Web Dialer` to your Telnyx number. This call should not be placed from the same number as the number you set in your TeXML Bin. Once this call is received, it should transfer to your forwarding number and begin streaming the audio to your application. This audio will be seen in the developers console, separated by the Speaker.

The service exposes a path at `ws://your-url.ngrok.io/calls` to accept an audio stream to a websocket. After initially running the application, you can either stop (`Ctrl+C`) and restart the program with the same command (`npm run start`) or place a new call. 

