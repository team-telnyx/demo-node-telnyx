const sdk = require("microsoft-cognitiveservices-speech-sdk");
const wavefile = require("wavefile");
const { logOutput } = require("../telnyx/chalk");

const speechConfig = sdk.SpeechTranslationConfig.fromSubscription(
  process.env.MS_SUBSCRIPTION_KEY,
  process.env.MS_SERVICE_REGION
);

speechConfig.speechSynthesisOutputFormat =
  sdk.SpeechSynthesisOutputFormat.Audio16Khz128KBitRateMonoMp3;
speechConfig.speechSynthesisVoiceName = process.env.MS_TTS_VOICE;
speechConfig.speechRecognitionLanguage = process.env.BOT_LANGUAGE;

const pushStream = sdk.AudioInputStream.createPushStream(
  sdk.AudioStreamFormat.getWaveFormatPCM(8000, 16, 1)
);
const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

exports.answerWSMicrosoft = async (ws, req) => {
  const call_id = req.query.call_id;

  logOutput(`Microsoft websocket initiated\n`, "#0000FF");

  recognizer.startContinuousRecognitionAsync();

  playTTS(ws, call_id, process.env.WELCOME_PROMPT);

  recognizer.recognizing = function (s, e) {
    const stdoutText = e.result.text;
    if (stdoutText.length > process.stdout.columns - 16) {
      stdoutText =
        "..." +
        stdoutText.substring(
          stdoutText.length - process.stdout.columns + 16,
          stdoutText.length
        );
    }
    logOutput(`Recognizing: ${stdoutText}`, "#FF0000");
  };

  recognizer.recognized = async function (s, e) {
    if (ws.readyState === 1 && e.result.text) {
      playTTS(ws, call_id, e.result.text);
      logOutput(`Recognized: ${e.result.text}\n`, "#00FF00");
      logOutput(
        `---------------------------------------------------------------\n`,
        "#FFFF00"
      );
    }
  };

  recognizer.canceled = function (s, e) {
    logOutput(`Recognition cancelled with reason: ${e}\n`, "#0000FF");
  };

  recognizer.sessionStarted = function (s, e) {
    logOutput(
      `Recognizer session started, SessionId: ${e.sessionId}\n`,
      "#0000FF"
    );
  };

  recognizer.sessionStopped = function (s, e) {
    logOutput(
      `Recognizer session stopped, SessionId: ${e.sessionId}\n`,
      "#0000FF"
    );
    recognizer.stopContinuousRecognitionAsync();
  };

  recognizer.speechStartDetected = function (s, e) {
    logOutput(`Speech start detected, SessionId: ${e.sessionId}\n`, "#0000FF");
    logOutput(
      `---------------------------------------------------------------\n`,
      "#FFFF00"
    );
  };

  recognizer.speechEndDetected = function (s, e) {
    logOutput(`Speech stop detected, SessionId: ${e.sessionId}\n`, "#0000FF");
  };

  ws.on("message", (message) => {
    const msg = JSON.parse(message);
    switch (msg.event) {
      case "connected":
        logOutput(`Websocket stream connected\n`, "#0000FF");
        break;
      case "start":
        logOutput(`Websocket stream started\n`, "#0000FF");
        break;
      case "media":
        const rawPcm = convertToPCM(msg.media.payload);
        pushStream.write(rawPcm);
        break;
      case "stop":
        logOutput(`Websocket stream stopped\n`, "#0000FF");
        pushStream.close();
        recognizer.stopContinuousRecognitionAsync();
        break;
      default:
        logOutput(`Other websocket message: ${msg}\n`, "#0000FF");
        break;
    }
  });

  ws.on("close", () => {
    recognizer.stopContinuousRecognitionAsync();
    logOutput(`Websocket closed\n`, "#0000FF");
  });
};

const playTTS = (ws, call_id, text) => {
  synthesizer.speakTextAsync(
    text,
    (response) => {
      const data = Buffer.from(response.audioData).toString("base64");
      const dataObj = {
        event: "media",
        stream_id: call_id,
        media: { payload: data },
      };
      ws.send(JSON.stringify(dataObj));
    },
    (error) => {
      logOutput(`Error synthesizing speech: ${error}`, "#FF0000");
    }
  );
};

const convertToPCM = (payload) => {
  const wav = new wavefile.WaveFile();
  wav.fromScratch(1, 8000, "8m", Buffer.from(payload, "base64"));
  wav.fromMuLaw();
  const samples = wav.data.samples;
  return samples;
};
