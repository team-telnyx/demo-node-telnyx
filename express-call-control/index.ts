// Telnyx Call Control Demo

// Set up environmental variables from .env file
import "dotenv/config";

// Library Requirements
import express from "express";
import bodyParser from "body-parser";
import nunjucks from "nunjucks";

// Set up telnyx library with user API Key
import Telnyx from "telnyx";
const telnyx = new Telnyx(process.env.TELNYX_API_KEY || "");

// Fire up express app and settings
const app = express();
app.use(express.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// Set default express engine and extension
app.engine("html", nunjucks.render);
app.set("view engine", "html");

// configure nunjucks engine
nunjucks.configure("templates/views", {
  autoescape: true,
  express: app,
});

// Simple page that can send a phone call
app.get("/", function (request, response) {
  response.render("messageform");
});

app.post("/outbound", async (request, response) => {
  const to_number = request.body.to_number;

  try {
    const { data: call } = await telnyx.calls.create({
      connection_id: process.env.TELNYX_CONNECTION_ID || "",
      to: to_number,
      from: process.env.TELNYX_NUMBER || "",
      timeout_secs: 0,
      time_limit_secs: 0,
      answering_machine_detection: "premium",
      media_encryption: "disabled",
      sip_transport_protocol: "UDP",
      stream_track: "inbound_track",
      send_silence_when_idle: false,
      webhook_url_method: "POST",
      record_channels: "single",
      record_format: "wav",
      record_max_length: 0,
      record_timeout_secs: 0,
      enable_dialogflow: false,
      transcription: false,
    });

    response.render("messagesuccess");
    console.log(call?.call_control_id);
  } catch (e) {
    response.send(e);
  }
});

type CallControlEvent =
  | Telnyx.events.CallHangupEvent
  | Telnyx.events.CallInitiatedEvent
  | Telnyx.events.CallAnsweredEvent
  | Telnyx.events.CallSpeakEndedEvent;

app.post("/call_control", async (request, response) => {
  response.sendStatus(200);

  const data = (request.body as CallControlEvent).data!;
  try {
    const callControlId = data.payload!.call_control_id!;

    if (data.event_type == "call.hangup") {
      console.log("Call has ended.");
    } else if (data.event_type == "call.initiated") {
      telnyx.calls.answer(callControlId, {
        stream_track: "inbound_track",
        send_silence_when_idle: false,
        webhook_url_method: "POST",
        transcription: false,
      });
    } else if (data.event_type == "call.answered") {
      telnyx.calls.speak(callControlId, {
        payload:
          "Hello, Telnyx user! Welcome to this call control demonstration.",
        voice: "male",
        language: "en-US",
        payload_type: "text",
        service_level: "premium",
      });
    } else if (data.event_type == "call.speak.ended") {
      console.log("Speak has ended.");
      telnyx.calls.hangup(callControlId, {});
    }
  } catch (error) {
    console.log("Error issuing call command");
    console.log(error);
  }
});

// Fire up the app on port specified in env
app.listen(process.env.TELNYX_APP_PORT);
console.log(`Server listening on port ${process.env.TELNYX_APP_PORT}`);
