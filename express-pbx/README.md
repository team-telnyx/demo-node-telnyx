# Express PBX - Telnyx Demo Applications

This directory contains two PBX implementations using different Telnyx voice technologies:

## Applications

### 1. TeXML Application (`/TeXML`)
- **Technology**: Telnyx TeXML (XML-based webhooks)
- **Approach**: Stateless XML responses to webhooks
- **Port**: Uses shared `PORT` from `.env`
- **Connection**: Uses `TELNYX_TEXML_CONNECTION_ID`

### 2. Voice API Application (`/VoiceAPI`)
- **Technology**: Telnyx Voice API (Real-time call control)
- **Approach**: Direct API calls with call state management
- **Port**: Uses shared `PORT` from `.env`
- **Connection**: Uses `TELNYX_VOICEAPI_CONNECTION_ID`

## Shared Configuration

Both applications use a single `.env` file in this directory for configuration.

### Setup

1. Copy the environment template:
```bash
cp .env.sample .env
```

2. Configure your environment variables:
```env
# Shared Telnyx Configuration
TELNYX_API_KEY=your_telnyx_api_key_here
TELNYX_PUBLIC_KEY=your_telnyx_public_key_here

# Different connection IDs for each app type
TELNYX_TEXML_CONNECTION_ID=your_texml_connection_id_here
TELNYX_VOICEAPI_CONNECTION_ID=your_voice_api_connection_id_here

# Shared server configuration
PORT=8000
BASE_URL=https://your-ngrok-url.ngrok-free.app
SUBDOMAIN=your_sip_subdomain_here
```

### Shared Database

Both applications use a shared database configuration with a fallback system:

### Database Loading Priority:
1. **`database.json`** - Your local configuration (gitignored, for contributors)
2. **`database.sample.json`** - Template file (committed to git)

### First-time Setup:
```bash
# Copy the sample to create your local database
cp database.sample.json database.json

# Edit database.json with your extensions and routing
```

### For Contributors:
Your `database.json` file is automatically ignored by git, so you can safely customize it without affecting the repository.

### Database Contents:
- Extension configurations
- Ring group definitions  
- Inbound routing rules

## Running the Applications

**Important**: Only run one application at a time as they share the same port.

### Quick Setup
```bash
# Install all dependencies (single install for both apps)
npm install

# Use the interactive switcher (recommended)
npm run switch
```

### Manual Application Start

#### TeXML Application
```bash
npm run texml

# Development with auto-restart
npm run texml:dev
```

#### Voice API Application
```bash
npm run voiceapi

# Development with auto-restart
npm run voiceapi:dev
```

## Application Switcher

The included `switcher.js` utility automatically configures your Telnyx connections when switching between applications.

### Features:
- 🔄 **Automatic Configuration**: Sets webhook URLs and SIP subdomains
- 📞 **Phone Number Management**: Updates all DIDs from database to use selected application
- 🧹 **Conflict Resolution**: Clears settings from inactive applications
- 📊 **Status Display**: Shows current connection and phone number assignments
- ⚡ **Quick Switching**: One command to switch between apps

### Usage:
```bash
npm run switch
```

The switcher will:
1. Show you current connection and phone number configurations
2. Let you choose which app to activate
3. Clear conflicting settings from the other app
4. Configure the chosen app with correct webhook URLs and subdomains
5. Update all phone numbers from `inboundRouting` to use the selected connection
6. Provide startup instructions and update summary

### What it configures:
- **TeXML Connection**: Webhook URL + SIP Subdomain + Phone Number Routing
- **Voice API Connection**: Webhook URL + SIP Subdomain + Phone Number Routing
- **Phone Numbers**: All DIDs from `database.json` inboundRouting automatically assigned to selected connection

### Phone Number Management:
The switcher reads all DIDs from your `database.json` file's `inboundRouting` section and automatically updates them on the Telnyx platform to use the selected application's connection. This ensures:
- ✅ Incoming calls route to the correct application
- ✅ No manual phone number configuration needed
- ✅ Seamless switching between TeXML and Voice API
- ✅ Clear reporting of successful/failed updates

## Features (Both Applications)

- ✅ **Inbound Call Handling** - Route incoming calls to extensions
- ✅ **Extension-to-Extension Dialing** - Internal SIP calls
- ✅ **Ring Groups** - Simultaneous and sequential ringing
- ✅ **PSTN Outbound** - External call routing
- ✅ **Voicemail** - Recording when unavailable
- ✅ **DTMF Support** - Handle button presses

## Webhook Configuration

Configure your Telnyx connections with these webhook URLs:

### TeXML Connection
- **Webhook URL**: `{BASE_URL}/texml/inbound`

### Voice API Connection
- **Webhook URL**: `{BASE_URL}/voice/webhook`

## Development

Use ngrok for local development:
```bash
ngrok http 8000
```

Update your `.env` with the ngrok URL and configure your Telnyx connections accordingly.

## Architecture Comparison

| Feature | TeXML | Voice API |
|---------|-------|-----------|
| **Approach** | XML responses | Direct API calls |
| **Call State** | Stateless | Stateful |
| **Complexity** | Lower | Higher |
| **Flexibility** | Medium | High |
| **Real-time Control** | Limited | Full |

Choose the approach that best fits your use case!