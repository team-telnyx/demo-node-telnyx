const speech = require("@google-cloud/speech");
const textToSpeech = require("@google-cloud/text-to-speech");
const { logOutput } = require("../telnyx/chalk");

const request = {
  config: {
    encoding: process.env.GOOGLE_ENCODING,
    sampleRateHertz: process.env.GOOGLE_SAMPLE_RATE,
    languageCode: process.env.BOT_LANGUAGE,
  },
  interimResults: true,
};

let recognizeStream = null;

const sttClient = new speech.SpeechClient();
const ttsClient = new textToSpeech.TextToSpeechClient();

exports.answerWSGoogle = async (ws, req) => {
  const call_id = req.query.call_id;

  logOutput(`Google websocket initiated\n`, "#0000FF");

  playTTS(ws, call_id, process.env.WELCOME_PROMPT);

  ws.on("message", async (message) => {
    const msg = JSON.parse(message);
    switch (msg.event) {
      case "connected":
        logOutput(`Websocket stream connected\n`, "#0000FF");
        break;
      case "start":
        logOutput(`Websocket stream started\n`, "#0000FF");
        logOutput(
          `---------------------------------------------------------------\n`,
          "#FFFF00"
        );
        startStream(ws, call_id);
        break;
      case "media":
        if (recognizeStream) recognizeStream.write(msg.media.payload);
        break;
      case "stop":
        logOutput(`Websocket stream stopped\n`, "#0000FF");
        break;
      default:
        logOutput(`Other websocket message: ${msg}\n`, "#0000FF");
        break;
    }
  });

  ws.on("close", () => {
    recognizeStream.destroy();
    logOutput(`Websocket closed\n`, "#0000FF");
  });
};

const startStream = (ws, call_id) => {
  recognizeStream = sttClient
    .streamingRecognize(request)
    .on("error", (err) => {
      console.error(`API request error:`, err);
    })
    .on("data", (data) => {
      let stdoutText = "";
      if (data.results[0] && data.results[0].alternatives[0]) {
        stdoutText = data.results[0].alternatives[0].transcript;
      }
      if (data.results[0].isFinal) {
        playTTS(ws, call_id, stdoutText);
        logOutput(`Recognized: ${stdoutText}\n`, "#00FF00");
        logOutput(
          `---------------------------------------------------------------\n`,
          "#FFFF00"
        );
      } else {
        if (stdoutText.length > process.stdout.columns - 16) {
          stdoutText =
            "..." +
            stdoutText.substring(
              stdoutText.length - process.stdout.columns + 16,
              stdoutText.length
            );
        }
        logOutput(`Recognizing: ${stdoutText}`, "#FF0000");
      }
    });
};

const playTTS = async (ws, call_id, text) => {
  const ttsRequest = {
    input: {
      text: text,
    },
    voice: {
      languageCode: process.env.BOT_LANGUAGE,
      name: process.env.GOOGLE_VOICE_NAME,
    },
    audioConfig: {
      audioEncoding: "MP3",
      effectsProfileId: ["telephony-class-application"],
    },
  };
  const [response] = await ttsClient.synthesizeSpeech(ttsRequest);
  const data = Buffer.from(response.audioContent).toString("base64");
  const dataObj = {
    event: "media",
    stream_id: call_id,
    media: { payload: data },
  };
  ws.send(JSON.stringify(dataObj));
};
