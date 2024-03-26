const {
  TranscribeStreamingClient,
  StartStreamTranscriptionCommand,
} = require("@aws-sdk/client-transcribe-streaming");
const {
  PollyClient,
  SynthesizeSpeechCommand,
} = require("@aws-sdk/client-polly");

const { Readable, PassThrough } = require("stream");
const streamToBuffer = require("fast-stream-to-buffer");

const wavefile = require("wavefile");
const { logOutput } = require("../telnyx/chalk");

const MAX_AUDIO_CHUNK_SIZE = 48000;

let transcribeClient = new TranscribeStreamingClient({
  region: process.env.AWS_REGION,
});

let pollyClient = new PollyClient({ region: process.env.AWS_REGION });

const audioPayloadStream = new PassThrough();

exports.answerWSAmazon = async (ws, req) => {
  const call_id = req.query.call_id;

  logOutput(`Amazon websocket initiated\n`, "#0000FF");

  await playTTS(ws, call_id, process.env.WELCOME_PROMPT);

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
        await startStreaming(ws, call_id);
        break;
      case "media":
        const pcmData = convertToPCM(msg.media.payload);
        audioPayloadStream.write(pcmData);
        break;
      case "stop":
        logOutput(`Websocket stream stopped\n`, "#0000FF");
        transcribeClient.destroy();
        transcribeClient = undefined;
        pollyClient.destroy();
        pollyClient = undefined;
        logOutput(`AWS clients destroyed\n`, "#0000FF");
        break;
      default:
        logOutput(`Other websocket message: ${msg}\n`, "#0000FF");
        break;
    }
  });

  ws.on("close", () => {
    logOutput(`Websocket closed\n`, "#0000FF");
  });
};

const convertToPCM = (payload) => {
  const wav = new wavefile.WaveFile();
  wav.fromScratch(1, 8000, "8m", Buffer.from(payload, "base64"));
  wav.fromMuLaw();
  wav.toSampleRate(16000);
  const samples = wav.data.samples;
  return samples;
};

const playTTS = async (ws, call_id, text) => {
  const params = {
    TextType: "text",
    Text: text,
    OutputFormat: "mp3",
    VoiceId: process.env.AWS_VOICE_NAME,
  };

  const command = new SynthesizeSpeechCommand(params);

  pollyClient
    .send(command)
    .then(async (data) => {
      if (data.AudioStream instanceof Readable) {
        streamToBuffer(data.AudioStream, (err, buf) => {
          if (err) throw err;
          const string = buf.toString("base64");
          const dataObj = {
            event: "media",
            stream_id: call_id,
            media: { payload: string },
          };
          ws.send(JSON.stringify(dataObj));
        });
      } else {
        console.log("Stream not readable");
      }
    })
    .catch((error) => {
      console.error("Polly client error", error.message);
    });
};

const startStreaming = async (ws, call_id) => {
  const command = new StartStreamTranscriptionCommand({
    LanguageCode: process.env.BOT_LANGUAGE,
    MediaEncoding: process.env.AWS_MEDIA_ENCODING,
    MediaSampleRateHertz: process.env.AWS_SAMPLE_RATE,
    AudioStream: audioStream(),
  });

  try {
    const data = await transcribeClient.send(command);
    for await (const event of data.TranscriptResultStream) {
      for (const result of event.TranscriptEvent.Transcript.Results || []) {
        if (result.IsPartial === false) {
          logOutput(
            `Recognized: ${result.Alternatives[0].Transcript}\n`,
            "#00FF00"
          );
          logOutput(
            `---------------------------------------------------------------\n`,
            "#FFFF00"
          );
          await playTTS(ws, call_id, result.Alternatives[0].Transcript);
        } else {
          logOutput(
            `Recognizing: ${result.Alternatives[0].Transcript}`,
            "#FF0000"
          );
        }
      }
    }
  } catch (error) {
    console.log("Error:", error.message);
  }
};

const audioStream = async function* () {
  for await (const payloadChunk of audioPayloadStream) {
    if (payloadChunk.length <= MAX_AUDIO_CHUNK_SIZE) {
      yield { AudioEvent: { AudioChunk: payloadChunk } };
    }
  }
};
