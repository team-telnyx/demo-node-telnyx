# Telnyx Call Handling and Audio Processing Server

This project provides a proof of concept solution for handling calls and real-time audio processing using the Telnyx API. It integrates call answering, noise suppression, audio conversion, and WebSocket communication to offer insight for advanced call management and audio manipulation.

## Features

- **Call Answering & Management**: Automatically answer incoming calls and manage call states.
- **Noise Suppression**: Start and stop noise suppression on calls dynamically.
- **Real-time Audio Processing**: Convert audio from PCMU to MP3 format in real-time and stream it over WebSockets.
- **Enhanced Logging**: Override the default console.log for improved logging, including timestamped entries in a log file.
- **Flexible Configuration**: Configure the server using environment variables for API tokens, URLs, and server port.

## Prerequisites

- Node.js (v20.4)
- npm (Node Package Manager)
- Telnyx account and API credentials

## Installation

2. Install dependencies:

    ```bash
    npm install
    ```

3. Configure your environment variables by creating a `.env` file in the root directory and populating it with your Telnyx API credentials and other configuration settings:

    ```env
    TELNYX_API_TOKEN=your_telnyx_api_token_here
    TELNYX_STREAM_URL=your_telnyx_stream_url_here
    TELNYX_APP_PORT=5000 # Or any port you prefer
    ```

## Usage

To start the server, run:

```bash
npm start
```