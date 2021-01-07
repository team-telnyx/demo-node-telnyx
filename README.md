<div align="center">

# Telnyx Node Getting Started

![Telnyx](logo-dark.png)

Sample applications demonstrating Node SDK Basics

</div>

## Documentation & Tutorial

The full documentation and tutorial is available on [developers.telnyx.com](https://developers.telnyx.com/docs/v2/development/dev-env-setup?lang=dotnet&utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link)

## Pre-Reqs

You will need to set up:

* [Telnyx Account](https://telnyx.com/sign-up?utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link)
* [Telnyx Phone Number](https://portal.telnyx.com/#/app/numbers/my-numbers?utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link) enabled with:
  * [Telnyx Call Control Application](https://portal.telnyx.com/#/app/call-control/applications?utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link)
  * [Telnyx Outbound Voice Profile](https://portal.telnyx.com/#/app/outbound-profiles?utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link)
* Ability to receive webhooks (with something like [ngrok](https://developers.telnyx.com/docs/v2/development/ngrok?utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link))
* [Node & NPM](https://developers.telnyx.com/docs/v2/development/dev-env-setup?lang=node&utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link) installed

## What you can do

| Example                                    | Description                                                                                                                                                                           |
|:-------------------------------------------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [Express Messaging](express-messaging)     | Example working with inbound MMS & SMS messages, downloading media from inbound MMS, and uploading media to AWS S3.                                                                   |
| [Webinar Demo](webinar-demo)               | Example code from the intro to [Node Webinar](https://telnyx.com/resources/node-sdk-recap)                                                                                            |
| [Voicemail Detection](voicemail-detection) | Example code to detect and leave a voicemail                                                                                                                                          |
| [Outbound Call IVR](outbound-call-ivr)     | Example code to create an outbound call and present the callee with an option to press some digits. Leverages [TeXML](https://developers.telnyx.com/docs/v2/call-control/texml-setup) |
| [Simple Call Control Application](express-call-control)     | Example code to create a simple inbound call handler that speaks a message back as well as a simple form to submit an outbound call |

### Install

Run the following commands to get started

```
$ git clone https://github.com/team-telnyx/demo-node-telnyx.git
```
