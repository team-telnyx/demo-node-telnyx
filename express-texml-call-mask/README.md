<div align="center">

# Telnyx-Node TeXML & Masked-Calling Demo

![Telnyx](../logo-dark.png)

Sample application demonstrating Telnyx-Node Call Mask with TeXML

</div>

## Documentation & Tutorial

The full documentation and tutorial is available on [developers.telnyx.com](https://developers.telnyx.com/docs/development?lang=node&utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link#developer-setup)

## Diagram

![dtmfDial.png](./dtmfDial.png)

## Pre-Reqs

You will need to set up:

- [Telnyx Account](https://telnyx.com/sign-up?utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link)
- [Telnyx Phone Number](https://portal.telnyx.com/#/app/numbers/my-numbers?utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link) enabled with:
- [Telnyx TeXML Application](https://developers.telnyx.com/docs/voice/programmable-voice/texml-setup)
- [Telnyx Outbound Voice Profile](https://portal.telnyx.com/#/app/outbound-profiles?utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link)
- Ability to receive webhooks (with something like [ngrok](https://developers.telnyx.com/docs/development?utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link#ngrok-setup))
- [Node & NPM](https://developers.telnyx.com/docs/development?lang=node&utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link#developer-setup) installed

## What you can do

- Call into your Telnyx Number
- Enter digits of the desired number to call
- Be forwarded to that number

## Usage

The following environmental variables need to be set

| Variable               | Description                                                                                                                                              |
| :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TELNYX_API_KEY`       | Your [Telnyx API Key](https://portal.telnyx.com/#/app/api-keys?utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link)              |
| `TELNYX_PUBLIC_KEY`    | Your [Telnyx Public Key](https://portal.telnyx.com/#/app/account/public-key?utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link) |
| `PORT`                 | **Defaults to `8000`** The port the app will be served                                                                                                   |
| `TELNYX_CONNECTION_ID` | The ID of the [**TeXML** call-control-connection](https://portal.telnyx.com/#/app/call-control/texml) to use for placing the calls                       |

### .env file

This app uses the excellent [dotenv](https://github.com/motdotla/dotenv) package to manage environment variables.

Make a copy of [`.env.sample`](./.env.sample) and save as `.env` and update the variables to match your creds.

```
TELNYX_PUBLIC_KEY="KEYasdf"
TELNYX_API_KEY="+kWXUag92mcU="
TELNYX_APP_PORT=8000
TELNYX_CONNECTION_ID=1494404757140276705
```

### Callback URLs For Telnyx Applications

| Callback Type                        | URL                            |
| :----------------------------------- | :----------------------------- |
| Inbound Call-Control Status Callback | `{ngrok-url}/dtmfDial/inbound` |

### Install

Run the following commands to get started

```
$ git clone https://github.com/team-telnyx/demo-node-telnyx.git
$ cd demo-node-telnyx/express-texml-call-mask
$ npm install
```

### Notes!

TeXML sends webhooks with Content-Type: `application/x-www-form-urlencoded`. As such; our express application should be configured to accept form encoded payloads.

Adding `app.use(express.urlencoded({ extended: true }));` to the application allows us to reference `req.body` to get the Webhook data.

### Ngrok

This application is served on the port defined in the runtime environment (or in the `.env` file). Be sure to launch [ngrok](https://developers.telnyx.com/docs/development?utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link#ngrok-setup) for that port

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

At this point you can point your application to generated ngrok URL + path (Example: `http://{your-url}.ngrok.io/texml/answer`).

### Setup & Run

#### Create a database

Edit the [`models/phoneNumberTable.json`](models/phoneNumberTable.json) file to fill in:

- Your Cell Phone Number(s)
- Your Telnyx Phone Number

#### Start the Server

Start the server `npm run start`

When you are able to run the server locally, the final step involves making your application accessible from the internet. So far, we've set up a local web server. This is typically not accessible from the public internet, making testing inbound requests to web applications difficult.

The best workaround is a tunneling service. They come with client software that runs on your computer and opens an outgoing permanent connection to a publicly available server in a data center. Then, they assign a public URL (typically on a random or custom subdomain) on that server to your account. The public server acts as a proxy that accepts incoming connections to your URL, forwards (tunnels) them through the already established connection and sends them to the local web server as if they originated from the same machine. The most popular tunneling tool is `ngrok`. Check out the [ngrok setup](https://developers.telnyx.com/docs/v2/development/ngrok) walkthrough to set it up on your computer and start receiving webhooks from inbound messages to your newly created application.

Once you've set up `ngrok` or another tunneling service you can add the public proxy URL to your Inbound Settings in the Mission Control Portal. To do this, click the edit symbol [✎] next to your [TeXML Applications](https://portal.telnyx.com/#/app/call-control/texml). In the "Inbound Settings" > "Webhook URL" field, paste the forwarding address from ngrok into the Webhook URL field. Add `texml/inbound` to the end of the URL to direct the request to the webhook endpoint in your server.

For now you'll leave “Failover URL” blank, but if you'd like to have Telnyx resend the webhook in the case where sending to the Webhook URL fails, you can specify an alternate address in this field.
