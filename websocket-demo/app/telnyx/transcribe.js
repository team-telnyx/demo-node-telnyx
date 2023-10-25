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
    const headers = {
      Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
      "Content-Type": "application/json",
    };
    const url = `https://api.telnyx.com/v2/calls/${payload.call_control_id}/actions/transcription_start`;

    axios
      .post(url, data, { headers })
      .then((response) => {
        logOutput(
          `Telnyx transcription initiated - ${response.data.data.result}\n`,
          "#0000FF"
        );
        logOutput(
          `---------------------------------------------------------------\n`,
          "#FFFF00"
        );
        const call = new telnyx.Call({
          call_control_id: payload.call_control_id,
        });
        await call.speak({
          payload: process.env.WELCOME_PROMPT,
          voice: "female",
          language: process.env.BOT_LANGUAGE,
        });
      })
      .catch((error) => {
        console.error(error);
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
