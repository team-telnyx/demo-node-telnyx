const axios = require("axios");
const qs = require("qs");

const make_call = async () => {
  // TWILIO ENVIRONMENT VARIABLES
  const TWILIO_BIN_URL = process.env.TWILIO_BIN_URL;
  const TWILIO_APP_ID = process.env.TWILIO_APP_ID;
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;
  const TWILIO_API_URL = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;

  // TELNYX ENVIRONMENT VARIABLES
  const TELNYX_BIN_URL = process.env.TELNYX_BIN_URL;
  const TELNYX_APP_ID = process.env.TELNYX_APP_ID;
  const TELNYX_ACCOUNT_SID = process.env.TELNYX_ACCOUNT_SID;
  const TELNYX_AUTH_TOKEN = process.env.TELNYX_AUTH_TOKEN;
  const TELNYX_FROM_NUMBER = process.env.TELNYX_FROM_NUMBER;
  const TELNYX_API_URL = `https://api.telnyx.com/v2/texml/Accounts/${TELNYX_ACCOUNT_SID}/Calls`;

  // COMMON ENVIRONMENT VARIABLES
  const TO_NUMBER = process.env.TO_NUMBER;
  const STATUS_CALLBACK = process.env.STATUS_CALLBACK_URL;

  const config = {
    method: "POST",
    url: TELNYX_API_URL,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${TELNYX_AUTH_TOKEN}`,
    },
    data: qs.stringify({
      Url: TELNYX_BIN_URL,
      ApplicationSid: TELNYX_APP_ID,
      From: TELNYX_FROM_NUMBER,
      To: TO_NUMBER,
      StatusCallback: STATUS_CALLBACK,
    }),
  };

  try {
    console.log(`Making outbound call...`);
    const response = await axios(config);
    console.log(`Call connected!`);
  } catch (error) {
    console.log("Error making outbound call:", error.response.data);
  }
};

module.exports = {
  make_call,
};
