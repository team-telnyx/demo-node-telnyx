require('dotenv').config()

const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

const callControlPath = '/call-control';
const callControl = require('./callControl');
app.use(callControlPath, callControl);

const bindingsPath = '/bindings'
const bindings = require('./bindings');
app.use(bindingsPath, bindings);

app.listen(process.env.TELNYX_APP_PORT);
console.log(`Server listening on port ${process.env.TELNYX_APP_PORT}`);
