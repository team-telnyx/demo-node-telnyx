# Live Translation App with Telnyx and OpenAI

This application is a live translation service that leverages Telnyx's TeXML and OpenAI's real-time translation capabilities to translate both sides of a phone conversation in real-time.

## Table of Contents

- [Live Translation App with Telnyx and OpenAI](#live-translation-app-with-telnyx-and-openai)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
    - [Open a Terminal and run](#open-a-terminal-and-run)
      - [Adding the public proxy URL to your Inbound Settings  in the Mission Control Portal](#adding-the-public-proxy-url-to-your-inbound-settings--in-the-mission-control-portal)
  - [Running the Application](#running-the-application)
  - [Testing the Application](#testing-the-application)
  - [Additional Notes](#additional-notes)
  - [Troubleshooting](#troubleshooting)
  - [License](#license)
  - [Acknowledgments](#acknowledgments)

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (version 20.10.0 or later)
- **npm** (comes with Node.js)
- **ngrok** (for exposing your local server)
- **Telnyx Account** with:
  - Active **API Key**
  - **Connection ID** set up for TeXML
  - A **Phone Number** purchased and configured
- **OpenAI Account** with an active **API Key**

## Installation

   **Clone the Repository**

   ```bash
   git clone https://github.com/your-username/telnyx-realtime-translation-app.git
   cd telnyx-realtime-translation-app
   ```

   **Install Dependencies**

   ```bash
   npm install
   ```

## Configuration

**Create Environment Variables**

   Copy the sample environment file and update it with your credentials:

   ```bash
   cp .env.sample .env
   ```

   Open the `.env` file and replace the placeholder values with your actual credentials:

   ```env
   # Telnyx
   TELNYX_API_KEY=your_telnyx_api_key_here
   TELNYX_CONNECTION_ID=your_connection_id
   TELNYX_AGENT_NUMBER=+1XXXXXXXXXX

   # OpenAI
   OPENAI_API_KEY=replace-with-api-key

   # App Config
   API_PORT=5050
   NODE_ENV=development
   NGROK_DOMAIN=your-ngrok-subdomain.ngrok.app
   ```

### Open a Terminal and run

```
ngrok http 8000
```

You should see something akin to:

```
$ ./ngrok http 5050

ngrok by @inconshreveable

Session Status                online
Account                       Little Bobby Tables (Plan: Free)
Version                       2.x.x
Region                        United States (us)
Web Interface                 http://127.0.0.1:4040
Forwarding                    http://ead8b6b4.ngrok.io -> localhost:8000
Forwarding                    https://ead8b6b4.ngrok.io -> localhost:8000

Connections                   ttl     opn     rt1.   rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

Once the tunnel has been opened and brought online, copy the `Forwarding` URL. It will look something like: `https://[your-ngrok-subdomain].ngrok.app`.

Once you've set up `ngrok` or another tunneling service, we will need to tell Telnyx to route it correctly.

#### Adding the public proxy URL to your Inbound Settings  in the Mission Control Portal

To do this, click  the edit symbol [✎] next to your [Call-Control Application](https://portal.telnyx.com/#/app/call-control/applications)

In the "App Info" > "Send a webhook to the URL:(Required)" field, paste the forwarding address from ngrok into the Webhook URL field. Add `/incoming-call` to the end of the URL to direct the request to the webhook endpoint in your server.

In this example the URL will be `http://ead8b6b4.ngrok.io/incoming-call`.

Note that the `ngrok` command above forwards to a development server running on port `8000`, which is the default port configured in this application. If
you override the `PORT` defined in `index.js`, you will need to update the `ngrok` command accordingly.

Keep in mind that each time you run the `ngrok http` command, a new URL will be created, and you'll need to update it everywhere it is referenced below.

   **Configure Telnyx Webhooks**

- Log in to your Telnyx dashboard.
- Navigate to **Connections** and select your connection.
- Under **TeXML URL**, set the webhook URL to:

     ```
     https://your-ngrok-domain.ngrok.app/incoming-call
     ```

- Replace `your-ngrok-domain.ngrok.app` with your actual ngrok domain.

## Running the Application

Start the application using:

```bash
npm run dev
```

This will start the server with hot-reloading enabled.

## Testing the Application

To test the application, follow these steps:

1. **Make a Test Call**

   Dial your Telnyx phone number from another phone. You should hear a prompt asking you to select your language.

2. **Select a Language**

   Follow the voice instructions to select a language by pressing the corresponding number on your dial pad.

3. **Simulate an Agent**

   The application is designed to connect to an agent at the number specified by `TELNYX_AGENT_NUMBER`. Ensure this number is capable of receiving calls.

4. **Conversation Translation**

   Once connected, speak in the selected language. The application will translate your speech to English for the agent and vice versa.

## Additional Notes

- **Supported Languages**

  The application currently supports the following languages:

  - English
  - Spanish
  - French
  - Mandarin
  - Hindi

- **Customizing Prompts**

  You can customize the voice prompts and messages by editing the `AI_PROMPT_CALLER` and `AI_PROMPT_AGENT` in `src/prompts.ts`.

- **Logging**

  The application uses `pino` for logging. Logs are output to the console in a readable format.

- **Error Handling**

  Ensure all environment variables are correctly set to prevent runtime errors.

## Troubleshooting

- **Common Issues**

  - **ngrok Not Forwarding Requests**: Ensure ngrok is running and the domain matches the one in your `.env` file.
  - **Telnyx Webhooks Not Triggering**: Double-check the webhook URLs configured in the Telnyx dashboard.
  - **OpenAI Errors**: Ensure your OpenAI API key is valid and has sufficient permissions.

- **Logs**

  Check the console output for logs that can help identify issues.

## License

This project is licensed under the MIT License.

## Acknowledgments

- **Telnyx** for providing the telephony services.
- **OpenAI** for the real-time translation API.
