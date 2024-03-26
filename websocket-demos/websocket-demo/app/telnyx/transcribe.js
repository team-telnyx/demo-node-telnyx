const axios = require("axios");
const { logOutput } = require("./chalk");
require("dotenv").config();
const telnyx = require("telnyx")(process.env.TELNYX_API_KEY);

exports.transcribeCall = async (payload, engine) => {
  try {
    const data = {
      language: "en",
      transcription_engine: engine,
    };

    const call = new telnyx.Call({
      call_control_id: payload.call_control_id,
    });

    const response = await call.transcription_start(data);
    logOutput(
      `Telnyx transcription initiated with engine ${engine.toUpperCase()} - ${
        response.data.result
      }\n`,
      "#0000FF"
    );
    logOutput(
      `---------------------------------------------------------------\n`,
      "#FFFF00"
    );

    await call.speak({
      payload: process.env.WELCOME_PROMPT,
      voice: "female",
      language: process.env.BOT_LANGUAGE,
    });
  } catch (error) {
    console.error(`HandleTranscribe - ${error}`);
  }
};

exports.handleTranscription = async (payload) => {
  try {
    const transcriptionData = payload.transcription_data;
    logOutput(`Recognized: ${transcriptionData.transcript}\n`, "#00FF00");
    logOutput(
      `---------------------------------------------------------------\n`,
      "#FFFF00"
    );
    const call = new telnyx.Call({
      call_control_id: payload.call_control_id,
    });
    if (transcriptionData.transcript !== "")
      await call.speak({
        payload: transcriptionData.transcript,
        voice: "female",
        language: process.env.BOT_LANGUAGE,
      });
  } catch (error) {
    console.error(`transcribeCall - ${error}`);
  }
};
