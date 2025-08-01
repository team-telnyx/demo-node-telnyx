# Voice API PBX

A Node.js Express application implementing PBX functionality using the Telnyx Voice API with MVC architecture.

## Features

- **Inbound Call Handling**: Answer and route incoming calls
- **Extension-to-Extension Dialing**: Internal SIP calls between extensions
- **Ring Groups**: Simultaneous and sequential ringing strategies
- **PSTN Outbound**: Route calls to external phone numbers
- **Voicemail**: Record messages when extensions are unavailable
- **DTMF Support**: Handle button presses during calls
- **Call State Management**: Track active calls and routing

## Architecture

This application follows MVC (Model-View-Controller) architecture:

- **Models**: Database access, routing logic, call state management
- **Controllers**: Handle webhook events and call flows
- **Services**: Telnyx Voice API integration
- **Routes**: Express route definitions
- **Middleware**: Webhook verification, error handling
- **Config**: Environment-based configuration

## Setup

### Prerequisites

- Node.js 18+ or 20+
- Telnyx account with Voice API connection
- ngrok or similar tunneling service for webhooks

### Installation

1. Install dependencies from the root directory:
```bash
cd .. && npm install
```

2. Copy environment template:
```bash
cp .env.sample .env
```

3. Configure environment variables in `../.env` (shared with TeXML app):
```env
TELNYX_API_KEY=your_api_key
TELNYX_PUBLIC_KEY=your_public_key
TELNYX_VOICEAPI_CONNECTION_ID=your_voice_connection_id
BASE_URL=https://your-ngrok-url.ngrok-free.app
PORT=8000
```

### Database Configuration

The application uses a shared database configuration system with automatic fallback:

```bash
# From the root directory, copy the sample database
cp database.sample.json database.json

# Edit database.json with your extensions and routing
```

**Database Loading Priority:**
1. `database.json` (your local config - gitignored)
2. `database.sample.json` (template)

Configure extensions, ring groups, and inbound routing in your `database.json` file.

### Running the Application

From the root directory:
```bash
# Start the Voice API server
npm run voiceapi

# Development with auto-restart
npm run voiceapi:dev
```

## Webhook Configuration

Configure your Telnyx Voice API connection to send webhooks to:

- **Webhook URL**: `{BASE_URL}/voice/webhook`
- **Failover URL**: (optional) `{BASE_URL}/voice/webhook`

### Required Webhook Events

- `call.initiated`
- `call.answered`
- `call.hangup`
- `call.dtmf.received`
- `call.recording.saved`

## Call Flows

### Inbound PSTN Calls
1. Call received on DID number
2. Lookup extension/ring group in database
3. Route according to ring strategy:
   - **Direct**: Single extension
   - **Simultaneous**: Ring all extensions at once
   - **Sequential**: Ring extensions one by one
4. Handle voicemail if no answer

### Extension-to-Extension Calls
1. SIP call received from extension
2. Parse destination extension
3. Route directly to target extension
4. Handle voicemail if unavailable

### Outbound PSTN Calls
1. Extension dials external number
2. Route through Telnyx PSTN gateway
3. Bridge calls when answered

## API Endpoints

- `GET /` - Health check
- `POST /voice/call.initiated` - Handle new calls
- `POST /voice/call.answered` - Handle answered calls
- `POST /voice/call.hangup` - Handle call endings
- `POST /voice/call.dtmf.received` - Handle DTMF input
- `POST /voice/call.recording.saved` - Handle voicemail recordings
- `POST /voice/webhook` - Generic webhook handler
- `GET /voice/health` - Service health check

## Development

### Testing Webhooks

Use ngrok to expose your local server:

```bash
ngrok http 3000
```

Update your `.env` file with the ngrok URL and configure your Telnyx connection.

### Debugging

The application includes extensive logging:
- 📞 Call events
- 🔢 DTMF input
- 🎙️ Recording events
- ❌ Errors
- 📡 Webhook events

## Deployment

1. Set production environment variables
2. Configure webhook URLs in Telnyx
3. Ensure database file is accessible
4. Start application with process manager (PM2, etc.)

## Differences from TeXML Version

- Uses Telnyx Voice API instead of TeXML
- Real-time call control vs. XML responses
- More granular event handling
- Better call state management
- Direct API calls vs. XML generation