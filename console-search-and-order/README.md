<div align="center">

# Telnyx-Node Available Number Searching

![Telnyx](../logo-dark.png)

Sample Console App demonstrating Telnyx-Node Available number Searching

</div>

## Documentation & Tutorial

The full documentation and tutorial is available on [developers.telnyx.com](https://developers.telnyx.com)

## Pre-Reqs

You will need to set up:

- [Telnyx Account](https://telnyx.com/sign-up?utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link)

## What you can do

- Search toll-free or local
- Perform partial searches
- Order numbers

## Usage

The following environmental variables need to be set

| Variable                      | Description                                                                                                                                                                                                       |
| :---------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TELNYX_API_KEY`              | Your [Telnyx API Key](https://portal.telnyx.com/#/app/api-keys?utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link)                                                                       |
| `TELNYX_CONNECTION_ID`        | Your [Call-Control](https://portal.telnyx.com/#/app/call-control/applications) or [TeXML](https://portal.telnyx.com/#/app/call-control/texml) or [SIP Connection](https://portal.telnyx.com/#/app/connections) ID |
| `TELNYX_MESSAGING_PROFILE_ID` | Your [Messaging Profile Id](https://portal.telnyx.com/#/app/messaging)                                                                                                                                            |
| `TELNYX_BILLING_GROUP_ID`     | Your [Billing Group Id](https://portal.telnyx.com/#/app/account/billing-groups)                                                                                                                                   |

### .env file

This app uses the [dotenv](https://www.npmjs.com/package/dotenv) package to manage environment variables.

Make a copy of [`.env.sample`](./.env.sample) and save as `.env` and update the variables to match your creds.

```
TELNYX_API_KEY=abc123
TELNYX_CONNECTION_ID=1522550179301951474
TELNYX_MESSAGING_PROFILE_ID=4001761e-e44e-4af8-a714-8565247f699d
TELNYX_BILLING_GROUP_ID=489c07f3-fb5e-4d1c-8f36-2089fb2ac3c8
```

### Install

Run the following commands to get started

```
$ git clone https://github.com/demo-telnyx/demo-node-telnyx.git
$ cd console-search-and-order
$ npm install
```

### Run

Run the Node script `npm run start` from the command line and answer the prompts to search and order

```bash
✔ toll-free or local search? … local
✔ areaCode to search? … 828
{
  features: [ 'sms' ],
  country_code: 'US',
  exclude_held_numbers: true,
  limit: 10,
  national_destination_code: '828'
}
✔ Would you like to perform a partial search? … no
✔ Which number would you like to order? › +18286720169
✔ (y/n) Order number: +18286720169 … yes
{
  connection_id: '1522550179301951474',
  messaging_profile_id: '4001761e-e44e-4af8-a714-8565247f699d',
  billing_group_id: '489c07f3-fb5e-4d1c-8f36-2089fb2ac3c8',
  phone_numbers: [ { phone_number: '+18286720169' } ]
}
```
