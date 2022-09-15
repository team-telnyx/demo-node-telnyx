require('dotenv').config();

const bodyParser = require('body-parser');
const path = require('path');

const WS_MODULE = require("ws");
const express = require("express");
const http = require('http');
const app = express();
const server = http.createServer(app);

const wss = new WS_MODULE.Server({
    server
});

const { Deepgram } = require("@deepgram/sdk");
const { Socket } = require('dgram');
const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);

const PORT = process.env.HOST_PORT || 9000;
server.listen(PORT, () =>{
    console.log(`SERVER listening at port: ${PORT} 🚀`);
});

wss.on('connection', function(conn){
    var inbound_samples = [];
    var outbound_samples = [];

    const deepgramLive = deepgram.transcription.live({
        //interim_results: true,
        //diarize: true,
        punctuate: true,
        encoding: "mulaw",
        sample_rate: 8000,
        model: "general",
        tier:"enhanced", 
        multichannel: true,
        channels: 2
    });

    deepgramLive.addListener('open', () =>{
        console.log("Deepgram connection opened");
    });

    deepgramLive.addListener('close', () => {
        console.log('Deepgram Connection closed.');
    });

    deepgramLive.addListener("transcriptReceived", message => {
        const data = JSON.parse(message);
        if(data.channel.alternatives[0].transcript.length > 0){
            // logging entire deepgram response
            //console.dir(data, { depth: null });

            // logging transcript only with no speaker separation
            // console.dir(data.channel.alternatives[0].transcript, { depth: null });

            // speaker separated channel based logging
            console.dir(`Speaker ${parseInt(data.channel_index[0]) + 1}: ${data.channel.alternatives[0].transcript}`, { depth: null });
            // diarizer based logging
            // fill in logic here
        }
    })

    conn.on('message', function(message) {
        const parsed = JSON.parse(message);
        if(parsed.event === "connected"){
            console.log("We have connected to the websocket!");
        } else if (parsed.event === "start"){
            console.log("Websocket streaming has started.");
        } else if (parsed.event === "media"){
            // decode base64 payload into buffer
            let chunk = Buffer.from(parsed.media.payload, "base64");
            if (parsed.media.track === "inbound"){
                for (let i = 0; i < chunk.length; i++) {
                    inbound_samples.push(chunk[i]);
                }
            }else if(parsed.media.track === "outbound"){
                for (let i = 0; i < chunk.length; i++) {
                    outbound_samples.push(chunk[i]);
                }
            }
            //mix tracks
            let mixable_length = Math.min(inbound_samples.length, outbound_samples.length);
            if (mixable_length > 0) {
                var mixed_samples = Buffer.alloc(mixable_length * 2);
                for (let i = 0; i < mixable_length; i++) {
                    mixed_samples[2 * i] = inbound_samples[i];
                    mixed_samples[2 * i + 1] = outbound_samples[i];
                }

                inbound_samples = inbound_samples.slice(mixable_length);
                outbound_samples = outbound_samples.slice(mixable_length);
                if (deepgramLive && deepgramLive.getReadyState() === 1) {
                    deepgramLive.send(Buffer.from(mixed_samples));
                }
            }
        }
    });

    conn.on('close', function(reasonCode, description) {
        console.log('Client has disconnected.');
    });

    conn.onerror = function () {
        console.log("some error occurred")
        if (deepgramLive && deepgramLive.getReadyState() === 1) {
            deepgramLive.finish();
        }
    }
});