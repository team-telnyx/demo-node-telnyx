# Telnyx TeXML Asynchronous AMD Example

> **Outbound dialer with asynchronous premium answering machine detection using TeXML**

A Node.js application that demonstrates how to build an outbound dialer using Telnyx TeXML API with **asynchronous premium answering machine detection**. This example shows how AMD runs in the background while the call is active, and uses the TeXML Call Update API to deliver different messages based on whether a human or voicemail answers.

## Features

- **Asynchronous AMD**: AMD processing happens in the background without blocking the call
- **Premium Detection**: Uses Telnyx premium answering machine detection for 95%+ accuracy
- **Dynamic Message Routing**: Updates active calls with different messages for humans vs voicemail
- **TeXML Call Update API**: Uses inline TeXML to modify call flow in real-time
- **Callback-based Architecture**: Status callbacks trigger appropriate responses
- **Easy Configuration**: Environment-based configuration with `.env` file

## How It Works

This example demonstrates the **asynchronous AMD workflow** which is different from synchronous AMD:

1. **Dialer initiates call** with `AsyncAmd: true` - AMD runs in background while call connects
2. **Initial TeXML response** keeps call active with a greeting message and pause
3. **AMD completes** - Telnyx sends callback to `/texml/status` with `AnsweredBy` result
4. **Server updates call** using TeXML Call Update API with inline TeXML
5. **Appropriate message plays** immediately based on detection result:
   - **Human**: Plays personalized message with call-to-action
   - **Voicemail**: Leaves brief callback message
   - **Fax**: Hangs up immediately
   - **Unknown**: Plays default message

See [AMD_FLOW.md](AMD_FLOW.md) for detailed flow diagram and technical explanation.

## AMD Detection Results

The `AnsweredBy` parameter can contain:

- `human` - A human answered the call
- `machine_start` - Beginning of machine/voicemail greeting
- `machine_end_beep` - End of machine greeting with beep
- `machine_end_other` - End of machine greeting without beep
- `fax` - Fax machine detected
- `unknown` - Unable to determine

## Prerequisites

- [Node.js](https://nodejs.org/) 14+ installed
- [Telnyx account](https://telnyx.com/sign-up) with API key
- Telnyx phone number configured for Voice
- TeXML Application ID (create in [Mission Control Portal](https://portal.telnyx.com))
- SSL certificates for HTTPS server
- Publicly accessible HTTPS URL for webhooks

## Installation

1. **Clone the repository** (or download this folder)
   ```bash
   git clone https://github.com/team-telnyx/demo-node-telnyx.git
   cd demo-node-telnyx/express-texml-async-amd
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your values:
   ```env
   TELNYX_API_KEY=KEYxxxx
   TELNYX_ACCOUNT_SID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   TELNYX_APPLICATION_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   TELNYX_PHONE_NUMBER=+1234567890
   TEXML_APP_URL=https://your-domain.com:3000/texml
   PORT=3000
   ```

4. **Set up SSL certificates**

   Update [server.js:13-14](server.js#L13-L14) with your certificate paths:
   ```javascript
   const SSL_CERT_PATH = '/path/to/your/fullchain.pem';
   const SSL_KEY_PATH = '/path/to/your/privkey.pem';
   ```

   For development, you can use [Let's Encrypt](https://letsencrypt.org/) or [ngrok](https://ngrok.com/) for HTTPS tunneling.

## Usage

### 1. Start the TeXML Server

```bash
npm start
```

The server will start on HTTPS port 3000 (or your configured `PORT`). You should see:

```
🚀 TeXML AMD Server running on HTTPS port 3000
   TeXML endpoint: https://your-domain.com:3000/texml
   Status callback: https://your-domain.com:3000/texml/status
```

### 2. Configure Phone Numbers to Dial

Edit [dialer.js:15-17](dialer.js#L15-L17) and update the `PHONE_NUMBERS_TO_DIAL` array:

```javascript
const PHONE_NUMBERS_TO_DIAL = [
  '+12125551234',
  '+13105555678',
];
```

### 3. Run the Dialer

In a separate terminal:

```bash
npm run dial
```

The dialer will initiate calls to all numbers in the list. Watch the server logs to see the AMD workflow in action.

## Project Structure

```
express-texml-async-amd/
├── dialer.js          # Outbound dialer script with AsyncAmd configuration
├── server.js          # Express HTTPS server with TeXML endpoints
├── package.json       # Dependencies and scripts
├── .env.example       # Environment variables template
├── AMD_FLOW.md        # Detailed flow diagram and technical explanation
└── README.md          # This file
```

### Key Files

- **[dialer.js](dialer.js)** - Initiates calls with `AsyncAmd: true` and `DetectionMode: 'Premium'`
- **[server.js](server.js)** - Handles TeXML requests and status callbacks, updates calls with TeXML Call Update API
- **[AMD_FLOW.md](AMD_FLOW.md)** - Complete flow diagram explaining the asynchronous AMD process

## Customizing Messages

Edit the `generateTeXMLResponse()` function in [server.js:133-200](server.js#L133-L200) to customize messages:

```javascript
case 'human':
case 'human_residence':
case 'unknown':
  message = `
    <Response>
      <Say voice="alice">
        Your custom message for humans here
      </Say>
      <Hangup/>
    </Response>
  `;
  break;

case 'machine_end_beep':
case 'machine_end_other':
  message = `
    <Response>
      <Pause length="1"/>
      <Say voice="alice">
        Your voicemail message here
      </Say>
      <Hangup/>
    </Response>
  `;
  break;
```

### Available TeXML Voice Options

- `alice` (female, US English)
- `man` (male, US English)
- `woman` (female, US English)
- See [TeXML Voice documentation](https://developers.telnyx.com/docs/voice/programmable-voice/texml-translator#say) for all options

## API Reference

### 1. Initiate TeXML Call with Async AMD

**POST** `https://api.telnyx.com/v2/texml/Accounts/{account_sid}/Calls`

```json
{
  "ApplicationSid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "To": "+13125551234",
  "From": "+13125555678",
  "Url": "https://your-domain.com/texml",
  "MachineDetection": "DetectMessageEnd",
  "DetectionMode": "Premium",
  "AsyncAmd": true,
  "AsyncAmdStatusCallback": "https://your-domain.com/texml/status",
  "StatusCallback": "https://your-domain.com/texml/status",
  "StatusCallbackMethod": "POST"
}
```

### 2. Update TeXML Call (used when AMD completes)

**POST** `https://api.telnyx.com/v2/texml/Accounts/{account_sid}/Calls/{call_sid}`

```json
{
  "Texml": "<Response><Say voice='alice'>Your message</Say><Hangup/></Response>"
}
```

**Headers for both:**
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
Accept: application/json
```

## What Makes This Different?

### Synchronous AMD (Traditional)
- Call connects → AMD analyzes → Result available in `AnsweredBy` parameter → TeXML response
- Human waits while AMD processes (2-6 seconds of silence)
- Single TeXML request contains the detection result

### Asynchronous AMD (This Example)
- Call connects → Initial TeXML plays → AMD runs in background → Callback with result → Update call
- Human hears greeting immediately, no dead air
- Uses TeXML Call Update API to inject new instructions mid-call
- More complex but better user experience

## Cost

- **Premium AMD**: $0.005 per call leg
- **TeXML Calls**: Standard voice pricing applies

## Resources

- [Telnyx TeXML AMD Documentation](https://developers.telnyx.com/docs/voice/programmable-voice/texml-answering-machine)
- [Initiate TeXML Call API](https://developers.telnyx.com/api/call-scripting/initiate-texml-call)
- [TeXML Response Overview](https://developers.telnyx.com/docs/voice/programmable-voice/texml-translator)

## Troubleshooting

### Calls not being initiated

- Verify your `TELNYX_API_KEY` and `TELNYX_ACCOUNT_SID` are correct
- Check that your phone number is in E.164 format (+country code + number)
- Ensure your Telnyx account has sufficient credit

### TeXML not being fetched

- Verify `TEXML_APP_URL` is publicly accessible via HTTPS
- Check that your server is running with valid SSL certificates
- Ensure port 3000 is open and accessible
- Review Telnyx webhook logs in Mission Control Portal

### AMD not working

- Ensure `MachineDetection` is set to "Enable"
- Verify `DetectionMode` is set to "Premium"
- Check that premium AMD is enabled on your Telnyx account

## License

MIT
