require('dotenv').config()

const bodyParser = require('body-parser')

const WebSocket = require("ws");
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const wss = new WebSocket.Server({
  server
});
const path = require("path");

//Include Google Speech to Text
const speech = require("@google-cloud/speech");
const client = new speech.SpeechClient();

//Configure Transcription Request
const request = {
  config: {
    encoding: "MULAW",
    sampleRateHertz: 8000,
    languageCode: "en-GB"
  },
  interimResults: true
};

// Handle Web Socket Connection
wss.on("connection", function connection(ws) {
  console.log("New Connection Initiated");

  let recognizeStream = null;

  ws.on("message", function incoming(message) {
    const msg = JSON.parse(message);
    switch (msg.event) {
      case "connected":
        console.log(`A new call has connected.`);
        //Create Stream to the Google Speech to Text API
        recognizeStream = client
          .streamingRecognize(request)
          .on("error", console.error)
          .on("data", data => {
            console.log(data.results[0].alternatives[0].transcript);
            wss.clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(
                  JSON.stringify({
                    event: "interim-transcription",
                    text: data.results[0].alternatives[0].transcript
                  })
                );
              }
            });

          });

        break;
      case "start":
        console.log(`Starting Media Stream ${msg.streamSid}`);
        break;
      case "media":
        // Write Media Packets to the recognize stream
        recognizeStream.write(msg.media.payload);
        break;
      case "stop":
        console.log(`Call Has Ended`);
        recognizeStream.destroy();
        break;
    }
  });

});

//Handle HTTP Request
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "/index.html")));

app.post("/webhooks", bodyParser.json(), (req, res)  => {
  console.log(req.body);
  res.send('ok');
});

console.log("Listening at Port 8000");
server.listen(process.env.PORT || 8000);