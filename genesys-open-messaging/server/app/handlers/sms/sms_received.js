const debugTelnyx = require("debug")("app:Telnyx");
const { sendOpenMessage } = require("../genesys/openmessaging");

const sms_received = async (req) => {
  const { payload } = req.body.data;

  debugTelnyx(`SMS received from ${payload.from.phone_number}`);
  debugTelnyx(data.payload);

  debugTelnyx(`Sending SMS response to ${payload.from.phone_number}`);

  try {
    await sendOpenMessage(payload);
  } catch (err) {
    debugTelnyx("Send open message failed:", err);
  }
};

module.exports = {
  sms_received,
};
