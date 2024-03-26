/**
 * Initializes an HTTP and WebSocket server to handle incoming calls and real-time audio processing via the Telnyx API. 
 * This server setup involves integrating various functionalities including call answering, noise suppression management, 
 * Audio format conversion, and logging.
 *
 * Environment variables configure API tokens, stream URLs, and the server port. 
 * The server listens for webhook events from Telnyx to manage call lifecycle events 
 * Such as call initiation, answer, and hangup. 
 * 
 * It also establishes WebSocket connections to stream audio data, 
 * Converting it from PCMU to MP3 format on-the-fly before sending it back through the WebSocket.
 *
 * Key Components:
 * - Express app for handling HTTP requests from Telnyx webhook events.
 * - WebSocket server for real-time audio data communication.
 * - FFmpeg for audio format conversion, configured with paths from `@ffmpeg-installer/ffmpeg`.
 * - Custom modules for specific functionalities:
 *   - `startNoiseSuppression` and `stopNoiseSuppression` from './noiseSuppression.js' manage noise suppression.
 *   - `pcmuToMp3Base64` from './audioConversion.js' converts audio data from PCMU to MP3.
 *   - `setupLogger` from './logger.js' overrides console.log for enhanced logging.
 *   - `answerCall` from './answerCall.js' answers incoming calls via the Telnyx API.
 *   - `AudioBuffer` from './audioBuffer.js' buffers audio data for processing.
*/


// Standard Library Imports
import http from 'http';
import 'dotenv/config';

// Third-Party Library Imports
import express from 'express';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';
import { WebSocketServer } from 'ws';

// Custom Module Imports
import { answerCall } from './answerCall.js';
import { AudioBuffer } from './audioBuffer.js';
import { pcmuToMp3Base64 } from './audioConversion.js';
import { setupLogger } from './logger.js';
import { startNoiseSuppression, stopNoiseSuppression } from './noiseSuppression.js';


const TELNYX_API_TOKEN = process.env.TELNYX_API_TOKEN;
const TELNYX_STREAM_URL = process.env.TELNYX_STREAM_URL;
const TELNYX_APP_PORT = process.env.TELNYX_APP_PORT || 5000;
const API_HEADERS = {
    'Authorization': `Bearer ${TELNYX_API_TOKEN}`,
    'Content-Type': 'application/json'
};
const COMMAND_ID = "891510ac-f3e4-11e8-af5b-de00688a4901";
const CLIENT_STATE = "aGF2ZSBhIG5pY2UgZGF5ID1d";

setupLogger();
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
const app = express();
app.use(express.json());
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/websocket" });

async function setupServer() {

    app.post('/webhook', async (req, res) => {
        console.log('Webhook received:', req.body);
        const { event_type: eventType, payload } = req.body.data;
        const callControlId = payload?.call_control_id;

        switch (eventType) {
            case 'call.initiated':
                if (callControlId) {
                    console.log(`Answering call: ${callControlId}`);
                    await answerCall(callControlId, CLIENT_STATE, COMMAND_ID, TELNYX_STREAM_URL, API_HEADERS);
                }
                break;
            case 'call.answered':
                await startNoiseSuppression(callControlId, CLIENT_STATE, COMMAND_ID, API_HEADERS);
                break;
            case 'call.hangup':
                await stopNoiseSuppression(callControlId, CLIENT_STATE, COMMAND_ID, API_HEADERS);
                break;
        }
        res.json({ status: 'received' });
    });

    wss.on('connection', function connection(ws) {
        const audioBuffer = new AudioBuffer(async (combinedChunks) => {
            pcmuToMp3Base64(combinedChunks, (mp3Base64, error) => {
                if (error) {
                    console.error("Failed to convert audio:", error);
                    return;
                }
                ws.send(JSON.stringify({
                    "event": "media",
                    "media": {
                        "payload": mp3Base64
                    }
                }));
            });
        });

        ws.on('message', function incoming(message) {
            const data = JSON.parse(message);

            if (data.event === "media") {
                const chunk = Buffer.from(data.media.payload, 'base64');
                const sequenceNumber = data.sequence_number;
                audioBuffer.add(chunk, sequenceNumber);
            } else if (data.event === "stop") {
                audioBuffer.flush();
            }
        });

        console.log("WebSocket connection opened");
    });

    server.listen(TELNYX_APP_PORT, () => console.log(`HTTP and WebSocket Server started on http://localhost:${TELNYX_APP_PORT}`));
}

setupServer().catch(console.error);