// Telnyx 2FA Project Demo

// Set up environmental variables from .env file
require('dotenv').config()

// Library Requirements
const express = require('express');
const path = require('path');
const axios = require('axios');
const mysql = require('mysql');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const Connections = require('telnyx/lib/resources/Connections');

// Set up telnyx library with user API Key
const telnyx = require('telnyx')(process.env.TELNYX_API_KEY);

const connection = mysql.createConnection({
  host: process.env.DB_SERVER_NAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});
connection.connect((err) => {
  if (err) {
    console.log("Error connecting to Db");
    return;
  }
  console.log('Connected!');
});

// Fire up express app and settings
const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieParser());
app.use(bodyParser.json());

// Async function to initiate a new verification request
const create2FA = async (number) => {
  //Call Telnyx API to create a new 2FA with given number
  try {
    const headers = {
      "Authorization": "Bearer " + process.env.TELNYX_API_KEY,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
    const verify_request = {
      phone_number: number,
      twofa_profile_id: process.env.TELNYX_VERIFY_KEY,
      type: "sms",
      timeout: 300
    };
    const url = "https://api.telnyx.com/v2/verifications";

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
const verify2FA = async (number, code) => {
  //Call Telnyx API to submit a verify code
  try {
    const headers = {
      "Authorization": "Bearer " + process.env.TELNYX_API_KEY,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
    const verify_request = {
      code: code
    };
    const url = "https://api.telnyx.com/v2/verifications/by_phone_number/" + number + "/actions/verify"

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

// Async function to initiate a new verification submission with code
const insertUser = async (name, password, number) => {
  const query = 'INSERT INTO `users`(`username`, `password`, `phone`, `verified`) VALUES (?, ?, ?, 0)';
  connection.query(query, [name, password, number], (err, result) => {
    if (err) throw err;

    console.log(`Changed ${result.changedRows} row(s)`);
  });
}

const verifyUser = async (name) => {
  const query = 'UPDATE `users` SET `verified`=1 WHERE `username`=?';
  connection.query(query, [name], (err, result) => {
    if (err) throw err;

    console.log(`Changed ${result.changedRows} row(s)`);
  });
}

// Simple sign up page with built in post request
app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname+'/templates/signup.html'));
});


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

  insertUser(username, password, phone);

  const telnyx_response = await create2FA(phone);

  // If the verification was successfully created then we move to verify
	if (response) {
    response.cookie('username', username).cookie('number', phone).sendFile(path.join(__dirname+'/templates/verify.html'));
	} else {
		response.send('There was an error generating a validation');
		response.end();
	}
});

// Verify page retrieves try from post request and validates it
app.post('/verify', async(request, response) => {
  console.log('Cookies: ', request.cookies);
  const code_try = request.body.code;
  const telnyx_response = await verify2FA(request.cookies.number, code_try);
  verifyUser(request.cookies.username);
	if (response) {
		response.sendFile(path.join(__dirname+'/templates/welcome.html'));
	} else {
		response.send('Incorrect pin, please try again!');
		response.end();
	}
});


// Fire up the app on port specified in env
app.listen(process.env.TELNYX_APP_PORT);
console.log(`Server listening on port ${process.env.TELNYX_APP_PORT}`);