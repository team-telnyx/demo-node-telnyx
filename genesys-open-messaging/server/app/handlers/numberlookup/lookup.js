const telnyx = require("telnyx")(process.env.TELNYX_API_KEY);
const debugTelnyx = require("debug")("app:Telnyx");

const lookup = async (req, res) => {
  debugTelnyx("Number Lookup Request:", req.body);
  const { body } = req;
  let type = [];

  if (body.carrierLookup) type.push("carrier");
  if (body.callerLookup) type.push("caller-name");

  try {
    const result = await telnyx.numberLookup.retrieve(body.number, {
      type,
      webhook_url: `https://${process.env.API_SERVER_URL}/api/nl`,
      use_profile_webhooks: false,
    });
    debugTelnyx("Number Lookup Result");
    debugTelnyx(result);

    return res.status(200).send(result);
  } catch (error) {
    debugTelnyx("Number Lookup Error:", error.message);
    return res
      .status(error.statusCode ? error.statusCode : 500)
      .send({ message: error.message });
  }
};

module.exports = {
  lookup,
};
