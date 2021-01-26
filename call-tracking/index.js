require('dotenv').config()

const express = require('express');

const bindingsPath = '/bindings'
const callControlPath = '/call-control';

const callControl = require('./callControl');
const bindings = require('./bindings');
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(callControlPath, callControl);
app.use(bindingsPath, bindings);
app.listen(process.env.TELNYX_APP_PORT);
console.log(`Server listening on port ${process.env.TELNYX_APP_PORT}`);
