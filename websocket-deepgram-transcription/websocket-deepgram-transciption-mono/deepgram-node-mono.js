require('dotenv').config();

const telnyx = require("telnyx")(process.env.TELNYX_API_KEY);

const WS_MODULE = require("ws");
const express = require("express");
const http = require('http');
const app = express();
const server = http.createServer(app);

const wss = new WS_MODULE.Server({
    server
});

const { Deepgram } = require("@deepgram/sdk");
const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);

const PORT = process.env.HOST_PORT || 9000;
server.listen(PORT, () =>{
    console.log(`SERVER listening at port: ${PORT} 🚀`);
});

// Place outbound call
const dial = async () => {
	try {
		console.log("dial");
		const { data: call } = await telnyx.calls.create({
			connection_id: process.env.CONNECTION_ID,
			to: process.env.TO_NUMBER,
			from: process.env.FROM_NUMBER,
			stream_track: "inbound_track",
			stream_url: process.env.SOCKET_URL,
		});
	} catch (error) {}
};

wss.on('connection', function(conn){
    var buffer = new Buffer.alloc(0);

    // On connection to websocket, open a connection to deepgram
    const deepgramLive = deepgram.transcription.live({
        punctuate: true,
        interim_results: true,
        encoding: "mulaw",
        sample_rate: 8000,
        model: "general-polaris",
        channels: 1
        //language: "en-GB",
    });
    
    deepgramLive.addListener('open', () =>{
        console.log("Deepgram connection opened");
    });
    
    deepgramLive.addListener('close', () => {
        console.log('Deepgram Connection closed.');
    });
    
    // Listen for transcription from Deepgram
    deepgramLive.addListener("transcriptReceived", message => {
        const data = JSON.parse(message);
    
        // logging entire deepgram response
        // console.dir(data.channel, { depth: null });
    
        // logging transcript only
        console.dir(data.channel.alternatives[0].transcript, { depth: null });
    })

    // On audio message into websocket, parse message
    conn.on('message', async function(message) {
        const parsed = JSON.parse(message);
        if(parsed.event === "connected"){
            console.log("We have connected to the websocket!");
        } else if (parsed.event === "start"){
            console.log("Websocket streaming has started.");
        } else if (parsed.event === "media"){
            // Decode base64 encoded audio into buffer
            let chunk = Buffer.from(parsed.media.payload, "base64");
            if (parsed.media.track === "inbound"){
                buffer = Buffer.concat([buffer, chunk]);
                if(Buffer.byteLength(buffer) === 1600){ // Sending 10 chunks of 160 bytes at a time (configurable)
                    const websocketReadyState = deepgramLive.getReadyState();
                    if(websocketReadyState === 1){
                        deepgramLive.send(buffer);
                    }
                    buffer = new Buffer.alloc(0);
                }
            }
        }
    });

    conn.on('close', function(reasonCode, description) {
        console.log('Client has disconnected.');
    });
});

dial();