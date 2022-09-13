const axios = require("../axios/axios");
const { logOutput } = require("./chalk");
require("dotenv").config();
const telnyx = require("telnyx")(process.env.TELNYX_API_KEY);

exports.receiveCall = async (body, callback) => {
  const data = body.data;
  const call = new telnyx.Call({
    call_control_id: data.payload.call_control_id,
  });
  switch (data.event_type) {
    case "call.initiated":
      logOutput(`Call initiated: ${data.payload.call_control_id}\n`, "#0000FF");
      call.answer();
      break;
    case "call.answered":
      logOutput(`Call answered: ${data.payload.call_control_id}\n`, "#0000FF");
      logOutput(
        `Connecting call leg to websocket: ${data.payload.call_control_id}\n`,
        "#0000FF"
      );
      let wsUri =
        process.env.WS_URL +
        "/" +
        process.env.BOT_PROVIDER +
        "?call_id=" +
        data.payload.call_control_id;

      const apiUrl =
        process.env.TELNYX_API_URL +
        "/v2/calls/" +
        data.payload.call_control_id +
        "/actions/streaming_start";
      const config = {
        url: apiUrl,
        method: "post",
        headers: {
          "Content-type": "application/json",
          Accept: "application/json",
          Authorization: "Bearer " + process.env.TELNYX_API_KEY,
        },
        data: {
          stream_track: "inbound_track",
          stream_url: wsUri,
        },
      };
      try {
        await axios.sendRequest(config).then((response) => {
          logOutput(
            `Stream connect response: ${response.data.data.result}\n`,
            "#0000FF"
          );
        });
      } catch (error) {
        console.error(error.response.data.errors);
      }
      break;
    case "call.bridged":
      logOutput(
        `Call bridged: from ${data.payload.from}, to ${data.payload.to}\n`,
        "#0000FF"
      );
      break;
    case "call.hangup":
      logOutput(`Call hangup: ${data.payload.call_control_id}\n`, "#0000FF");
      break;
  }

  callback({});
};
