const axios = require('axios');

const headers = {
  "Authorization": "Bearer " + process.env.TELNYX_API_KEY,
  "Content-Type": "application/json",
  "Accept": "application/json"
};

const url = "https://api.telnyx.com/v2/verifications";

// Async function to initiate a new verification request
module.exports.create2FA = async (number) => {
  //Call Telnyx API to create a new 2FA with given number
  try {
    const verify_request = {
      phone_number: number,
      twofa_profile_id: process.env.TELNYX_VERIFY_KEY,
      type: "sms",
      timeout: 300
    };
    const telnyxResponse = await axios(
      {
        method: 'post',
        url: url,
        headers: headers,
        data: verify_request
      }
    );
    console.log('Verification created with id: ', telnyxResponse.data.data.id);
  }
  catch(e) {
    console.log('Error creating verification');
    console.log(e);
    return false;
  }
  return true;
}

// Async function to initiate a new verification submission with code
module.exports.verify2FA = async (number, code) => {
  //Call Telnyx API to submit a verify code
    const verify_request = {
      code: code
    };
    const url = "https://api.telnyx.com/v2/verifications/by_phone_number/" + number + "/actions/verify"
  try {
    const telnyxResponse = await axios(
      {
        method: 'post',
        url: url,
        headers: headers,
        data: verify_request
      }
    );
    console.log('Verification success with response: ', telnyxResponse.data.data.id);
  }
  catch(e) {
    console.log('Incorrect Verfication!');
    console.log(e);
    return false;
  }
  return true;

}


// module.exports = {
//   create2FA,
//   verify2FA
// }
