const recorder = require("node-record-lpcm16");
const speech = require("@google-cloud/speech");
require("dotenv").config();
const { logOutput } = require("./app/telnyx/chalk");

const client = new speech.SpeechClient();

const encoding = "LINEAR16";
const sampleRateHertz = 16000;
const languageCode = "en-US";

const request = {
  config: {
    encoding: encoding,
    sampleRateHertz: sampleRateHertz,
    languageCode: languageCode,
  },
  interimResults: true,
  // singleUtterance: true,
};

const speechCallback = (stream) => {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  let stdoutText = "";
  if (stream.results[0] && stream.results[0].alternatives[0]) {
    stdoutText = stream.results[0].alternatives[0].transcript;
  }
  if (stream.results[0].isFinal) {
    logOutput(`Recognized: ${stdoutText}\n`, "#00FF00");
    logOutput(
      `---------------------------------------------------------------\n`,
      "#FFFF00"
    );
  } else {
    if (stdoutText.length > process.stdout.columns) {
      stdoutText = stdoutText.substring(0, process.stdout.columns - 16) + "...";
    }
    logOutput(`Recognizing: ${stdoutText}`, "#FF0000");
    lastTranscriptWasFinal = false;
  }
};

const recognizeStream = client
  .streamingRecognize(request)
  .on("error", console.error)
  .on("data", speechCallback);

recorder
  .record({
    sampleRateHertz: sampleRateHertz,
    threshold: 0,
    verbose: false,
    recordProgram: "rec",
    silence: "10.0",
  })
  .stream()
  .on("error", console.error)
  .pipe(recognizeStream);

logOutput("\n\n", "#0000FF");
logOutput("Listening, press Ctrl+C to stop.\n", "#0000FF");
logOutput(
  `---------------------------------------------------------------\n`,
  "#FFFF00"
);
