// Telnyx 2FA Project Demo

// Set up environmental variables from .env file
require('dotenv').config()

// Library Requirements
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

// Set up telnyx library with user API Key
const telnyx = require('telnyx')(process.env.TELNYX_API_KEY);

// Fire up express app and settings
const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// Async function to initiate a new verification request
const create2FA = async (number) => {
  //TODO: Call Telnyx API to create a new 2FA with given number
  // try {
  //   const verify_request = {
  //     phone_number: number,
  //     twofa_profile_id: process.env.TELNYX_TWOFA_PROFILE,
  //     type: "sms",
  //     timeout: 300
  //   };
  //   const telnyxResponse = await telnyx.verifications.create(verify_request);
  //   console.log(`Verification created with id: ${telnyxResponse.data.id}`);
  // }
  // catch(e) {
  //   console.log('Error creating verification');
  //   console.log(e);
  //   return false;
  // }
  return true;
}

// Async function to initiate a new verification submission with code
const verify2FA = async (code) => {
  //TODO: Call Telnyx API to verify input code
  // try {
  //   const verify_request = {
  //     phone_number: number,
  //     code: code
  //   };
  //   const telnyxResponse = await telnyx.verifications.submit(verify_request);
  //   console.log(`Successfully verified: ${telnyxResponse.data.id}`);
  // }
  // catch(e) {
  //   console.log('Error creating verification');
  //   console.log(e);
  //   return false;
  // }
  return true;
}


// Simple sign up page with built in post request
app.get('/signup', function(request, response) {
	response.sendFile(path.join(__dirname+'/templates/signup.html'));
});

// Simple login page with builtin post request
app.get('/login', function(request, response) {
	response.sendFile(path.join(__dirname+'/templates/login.html'));
});

// Auth page 
app.post('/auth', async(request, response) => {

  // Retrieve attributes from post request
	var username = request.body.username;
  var password = request.body.password;
  var phone = request.body.number;

  const telnyx_response = await create2FA(phone);

  // If the verification was successfully created then we move to verify
	if (response) {
		response.sendFile(path.join(__dirname+'/templates/verify.html'));
	} else {
		response.send('There was an error generating a validation');
		response.end();
	}
});

// Verify page retrieves try from post request and validates it
app.post('/verify', async(request, response) => {
  const code_try = request.body.code;
  const telnyx_response = await verify2FA(code_try);
	if (response) {
		response.send('Phone <b>verified</b>. Thank you!');
	} else {
		response.send('Incorrect pin, please try again!');
		response.end();
	}
});


// Fire up the app on port specified in env
app.listen(process.env.TELNYX_APP_PORT);
console.log(`Server listening on port ${process.env.TELNYX_APP_PORT}`);