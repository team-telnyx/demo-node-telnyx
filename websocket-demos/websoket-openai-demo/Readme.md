# AI Voice Assistant using Telnyx and OpenAI

Build your own AI voice assistant that you can call on the phone! This Node.js application combines Telnyx's programmable voice capabilities with OpenAI's Realtime API to create interactive voice conversations with an AI.

## How It Works

1. A user calls your Telnyx phone number
2. The call is connected to your application via websockets
3. Voice audio is streamed in real-time between:
   - The caller (through using media streaming)
   - OpenAI's Realtime API
   - Back to the caller as synthesized speech

## Requirements

- Node.js v18 or higher
- [Telnyx Account](https://telnyx.com/sign-up)
- [OpenAI Account](https://platform.openai.com/) with Realtime API access
- A Telnyx phone number
- ngrok or similar tunnel service for development

## Quick Start

### 1. Clone and Install

```bash
git clone [repository-url]
cd [project-directory]
npm install
```

### 2. Set Up Your Environment

Copy the example environment file:
```bash
cp .env.example .env
```

Add your credentials to `.env`:
```
TELNYX_API_KEY=your_api_key_here
OPENAI_API_KEY=your_openai_key_here
PORT=5050
```

### 3. Start a Tunnel

For local development, start an ngrok tunnel:
```bash
ngrok http 5050
```

Save the generated URL (e.g., `https://your-subdomain.ngrok.app`).

### 4. Configure Telnyx

1. Log into your [Telnyx Portal](https://portal.telnyx.com)
2. Create a new TeXML Application:
   - Go to Voice → Programmable Voice → TeXML Applications → Create New Application
   - Set Webhook URL: `https://your-subdomain.ngrok.app/incoming-call`
   - Save the Application

3. Configure your phone number:
   - Go to Numbers tab of the application edit page
   - Assign your phone number

### 5. Run the Application

Start the server:
```bash
node index.js
```

Call your Telnyx number to start talking with your AI assistant!

## Development Notes

- The application runs on port 5050 by default
- Webhook endpoints:
  - `/incoming-call`: Handles initial call setup
  - `/media-stream`: Manages real-time audio streaming
- Remember to update your webhook URL if you restart ngrok