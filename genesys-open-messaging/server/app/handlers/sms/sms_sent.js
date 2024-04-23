const debugTelnyx = require("debug")("app:Telnyx");

const sms_sent = async (req) => {
  const { payload } = req.body.data;

  debugTelnyx(
    `SMS receipt received for message ID ${payload.id}, status: ${payload.to[0].status}`
  );
  debugTelnyx(payload);
};

module.exports = {
  sms_sent,
};
