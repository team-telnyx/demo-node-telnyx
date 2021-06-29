require('dotenv').config()

const express = require('express');
const cors = require('cors');

const mongoose = require('mongoose');
const favicon = require('serve-favicon');
const path = require('path')

const callControlPath = '/call-control';
const callPath = '/calls';
const initializationPath = '/initialization';
const usersPath = '/users';

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const TELNYX_APP_NAME = process.env.TELNYX_APP_NAME;
const CONNECTION_STRING = process.env.MONGODB_URI || `mongodb://localhost:27017/${TELNYX_APP_NAME}`
mongoose.connect(CONNECTION_STRING, { useNewUrlParser: true });

const callControlController = require('./controllers/callControlController');
const callController = require('./controllers/callController');
const initializationController = require('./controllers/initializationController');
const usersController = require('./controllers/users');

io.on('connection', (socket) => {
  console.log('a user connected');
});

const addIoToRoute = (req, res, next) => {
  req.io = io;
  next();
};

app.use(cors());
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(express.static('public'))
app.use(express.json());

app.use(callPath, callController);
app.use(callControlPath, callControlController);
app.use(usersPath, usersController);
app.use(initializationPath, initializationController);

const port = process.env.PORT || 3000;
http.listen(port);
console.log(`Server listening on port: ${port}`);
