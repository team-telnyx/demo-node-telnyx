// Telnyx 2FA Project Demo

// Set up environmental variables from .env file
require('dotenv').config()

// Library Requirements
const express = require('express');
const nunjucks = require('nunjucks');
const db = require('./db');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

// Set up telnyx library with user API Key
const telnyx = require('telnyx')(process.env.TELNYX_API_KEY);

// Fire up express app and settings
const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieParser());

// Set default express engine and extension
app.engine('html', nunjucks.render);
app.set('view engine', 'html');

// configure nunjucks engine
nunjucks.configure('templates/views', {
  autoescape: true,
  express: app
});

// Simple sign up page with built in post request
app.get('/', function(request, response) {
	response.render('signup');
});


// Simple sign up page with built in post request
app.get('/signup', function(request, response) {
  response.render('signup');
});

// Simple login page with builtin post request
app.get('/login', function(request, response) {
  response.render('login');
});

app.post('/loginauth', async(request, response) => {
  // Retrieve attributes from post request
	const username = request.body.username;
  const password = request.body.password;

  let rows;

  try {
    rows = await db.getUsername(username);
  }
  catch (e){
    console.log("error getting from database.");
    response.status(500);
    response.send(e);
    return;
  }

  if(rows && rows[0].password == password) {
    response.cookie('username', username).redirect('/welcome');
  } else {
    response.render('login', {error: "Invalid username/password combination"});
  }
});

app.get('/welcome', (request, response) =>{
  const username = request.cookies.username;

  response.render('welcome', {user: username})
})

// Auth page
app.post('/auth', async(request, response) => {

  // Retrieve attributes from post request
	const username = request.body.username;
  const password = request.body.password;
  const phone = request.body.number;

  let sameUsers;

  try {
    sameUsers = await db.getUsername(username);
  }
  catch (e){
    console.log("error updating database.");
    response.status(500);
    console.log(e);
    response.send(e);
    return;
  }

  // If we have a user already with that name, try again
  if(sameUsers.length > 0) {
    response.render('signup', {error: "Username already in use"});
  } else {
    try {
      await db.insertUser(username, password, phone);
    }
    catch (e){
      console.log("error updating database.");
      response.status(500);
      console.log(e);
      response.send(e);
      return;
    }
  
    let telnyx_response;
  
    try {
      telnyx_response = await telnyx.verifications.create({
        verify_profile_id: process.env.TELNYX_VERIFY_KEY,
        phone_number: phone,
        type: "sms",
        timeout: 300
      });
    }
    catch (e) {
      console.log("Error creating new code.");
      response.status(500);
      console.log(e);
      response.send(e);
    }
  
    // If the verification was successfully created then we move to verify
    if (telnyx_response) {
      response.cookie('username', username).cookie('number', phone).render('verify', {user: username});
    } else {
      response.render('verify', {error: "Incorrect Pin Code", user: request.cookies.username});
      response.end();
    }
  }
});

// Verify page retrieves try from post request and validates it
app.post('/verify', async(request, response) => {

  // Code attempt initiated
  const code_try = request.body.code;

  let telnyx_response;

  try {
    telnyx_response = await telnyx.verifications.byPhoneNumber.submit(request.cookies.number, {code: code_try});
  }
  catch (e) {
    console.log("Error submitting code.");
    console.log(e);
    response.status(500);
    response.send(e);
  }

  // If we got the correct code continue
	if (telnyx_response.data.response_code == "accepted") {

    // Verify the user
    try {
      db.verifyUser(request.cookies.username);
    }
    catch (e){
      console.log("error updating database");
      response.status(500);
      console.log(e);
      response.send(e);
      return;
    }

    // Render the welcome page
		response.render('welcome', {user: request.cookies.username});
	} else {
		response.render('verify', {error: "Incorrect PIN code. Please try again"});
	}
});


// Fire up the app on port specified in env
app.listen(process.env.TELNYX_APP_PORT);
console.log(`Server listening on port ${process.env.TELNYX_APP_PORT}`);