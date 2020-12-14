const axios = require('axios');
const urljoin = require('url-join');

const headers = {
  "Authorization": "Bearer " + process.env.TELNYX_API_KEY,
  "Content-Type": "application/json",
  "Accept": "application/json"
};

const baseUrl = "https://api.telnyx.com/v2/verifications";

// Async function to initiate a new verification request
module.exports.create2FA = number => {

  //Call Telnyx API to create a new 2FA with given number
  const verify_request = {
    phone_number: number,
    verify_profile_id: process.env.TELNYX_VERIFY_KEY,
    type: "sms",
    timeout: 300
  };

  return new Promise((resolve, reject) => {
    axios({
      method: 'post',
      url: baseUrl,
      headers: headers,
      data: verify_request
    }).then((response) => {
      console.log('Verification created with id: ', response.data.data.id);
      resolve(response);
    }, (error) => {
      reject(error);
    });
  });
}

// Function to initiate a new verification submission with code
module.exports.verify2FA = (number, code) => {
  //Call Telnyx API to submit a verify code
  const verify_request = {
    code: code
  };
  const url = urljoin(baseUrl, "by_phone_number", number, "actions/verify");

  return new Promise((resolve, reject) => {
    axios({
      method: 'post',
      url: url,
      headers: headers,
      data: verify_request
    }).then((response) => {
      resolve(response);
    }, (error) => {
      reject(error);
    });
  });

}