// Telnyx 2FA Project Demo

// Set up environmental variables from .env file
require('dotenv').config()

// Library Requirements
const express = require('express');
const path = require('path');
const verify = require('./telnyxVerify');
const db = require('./db');
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

  try {
    await db.insertUser(username, password, phone);
  }
  catch (e){
    console.log("error updating database");
    res.status(500);
    res.send(e);
    return;
  }

  const telnyx_response = await verify.create2FA(phone);

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
  const telnyx_response = await verify.verify2FA(request.cookies.number, code_try);
  db.verifyUser(request.cookies.username);
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