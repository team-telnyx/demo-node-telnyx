const AWS = require("aws-sdk");
const marshaller = require("@aws-sdk/eventstream-marshaller");
const util_utf8_node = require("@aws-sdk/util-utf8-node");
const v4 = require("./aws-signature-v4");
const wavefile = require("wavefile");
const WebSocket = require("ws");
const crypto = require("crypto");
const { logOutput } = require("../telnyx/chalk");

AWS.config.credentials = new AWS.Credentials(
  process.env.AWS_ACCESS_KEY_ID,
  process.env.AWS_SECRET_ACCESS_KEY
);
AWS.config.update({ region: process.env.AWS_REGION });

const Polly = new AWS.Polly();

const eventStreamMarshaller = new marshaller.EventStreamMarshaller(
  util_utf8_node.toUtf8,
  util_utf8_node.fromUtf8
);
let socket = null;

exports.answerWSAmazon = async (ws, req) => {
  const call_id = req.query.call_id;

  logOutput(`Amazon websocket initiated\n`, "#0000FF");

  playTTS(ws, call_id, process.env.WELCOME_PROMPT);

  const url = v4.createPresignedURL(
    "GET",
    `transcribestreaming.${process.env.AWS_REGION}.amazonaws.com:8443`,
    "/stream-transcription-websocket",
    "transcribe",
    crypto.createHash("sha256").update("", "utf8").digest("hex"),
    {
      key: process.env.AWS_ACCESS_KEY_ID,
      secret: process.env.AWS_SECRET_ACCESS_KEY,
      protocol: "wss",
      expires: 15,
      region: process.env.AWS_REGION,
      query: `language-code=${process.env.BOT_LANGUAGE}&media-encoding=${process.env.AWS_MEDIA_ENCODING}&sample-rate=${process.env.AWS_SAMPLE_RATE}`,
    }
  );

  socket = new WebSocket(url);
  socket.binaryType = "arraybuffer";
  wireSocketEvents(socket, ws, call_id);

  ws.on("message", (message) => {
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
        break;
      case "media":
        const rawPcm = convertToPCM(msg.media.payload);
        const buf = getAudioEventMessage(rawPcm);
        const binary = eventStreamMarshaller.marshall(buf);
        socket.send(binary);
        break;
      case "stop":
        logOutput(`Websocket stream stopped\n`, "#0000FF");
        socket.close();
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

const getAudioEventMessage = (buffer) => {
  return {
    headers: {
      ":message-type": {
        type: "string",
        value: "event",
      },
      ":event-type": {
        type: "string",
        value: "AudioEvent",
      },
    },
    body: buffer,
  };
};

const wireSocketEvents = async (socket, ws, call_id) => {
  socket.onmessage = async (message) => {
    const messageWrapper = eventStreamMarshaller.unmarshall(
      Buffer.from(message.data)
    );
    const messageBody = JSON.parse(
      String.fromCharCode.apply(String, messageWrapper.body)
    );
    if (
      messageBody &&
      messageBody.Transcript &&
      messageBody.Transcript.Results[0]
    ) {
      if (messageBody.Transcript.Results[0].IsPartial) {
        const stdoutText =
          messageBody.Transcript.Results[0].Alternatives[0].Transcript;
        if (stdoutText.length > process.stdout.columns - 16) {
          stdoutText =
            "..." +
            stdoutText.substring(
              stdoutText.length - process.stdout.columns + 16,
              stdoutText.length
            );
        }
        logOutput(`Recognizing: ${stdoutText}`, "#FF0000");
      } else {
        playTTS(
          ws,
          call_id,
          messageBody.Transcript.Results[0].Alternatives[0].Transcript
        );
        logOutput(
          `Recognized: ${messageBody.Transcript.Results[0].Alternatives[0].Transcript}\n`,
          "#00FF00"
        );
        logOutput(
          `---------------------------------------------------------------\n`,
          "#FFFF00"
        );
      }
    }
  };

  socket.onerror = function (err) {
    console.error("AWS socket error:", err);
  };

  socket.onclose = function (closeEvent) {
    logOutput("AWS socket closed\n", "#0000FF");
  };
};

const playTTS = async (ws, call_id, text) => {
  const ttsRequest = {
    Text: text,
    OutputFormat: "mp3",
    VoiceId: process.env.AWS_VOICE_NAME,
  };
  Polly.synthesizeSpeech(ttsRequest, (err, response) => {
    if (err) {
      console.log(err.code);
    } else if (response) {
      if (response.AudioStream instanceof Buffer) {
        const data = Buffer.from(response.AudioStream).toString("base64");
        const dataObj = {
          event: "media",
          stream_id: call_id,
          media: { payload: data },
        };
        ws.send(JSON.stringify(dataObj));
      }
    }
  });
};
