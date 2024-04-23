const telnyx = require("telnyx")(process.env.TELNYX_API_KEY);
const debugTelnyx = require("debug")("app:Telnyx");

const sms_send = async (req, res) => {
  const { body } = req;

  debugTelnyx(`Sending SMS...`);
  debugTelnyx(body);

  try {
    const result = await telnyx.messages.create({
      from: body.senderId,
      to: body.number,
      text: body.text,
      messaging_profile_id: process.env.TELNYX_MESSAGING_PROFILE_ID,
      tags: ["Genesys Cloud"],
      webhook_url: `${process.env.API_SERVER_URL}/api/sms/inbound`,
      use_profile_webhooks: false,
    });

    debugTelnyx("Send SMS response");
    debugTelnyx(result.data);

    return res.status(200).send({ message: "SMS successfully sent" });
  } catch (err) {
    debugTelnyx("Send SMS Error:", err.message);
    return res
      .status(err.statusCode ? err.statusCode : 500)
      .send({ message: err.message });
  }
};

module.exports = {
  sms_send,
};
