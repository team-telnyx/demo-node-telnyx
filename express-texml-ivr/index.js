require('dotenv').config()

const express = require('express');
const texmlPath = '/texml';

const app = express();
const http = require('http').createServer(app);

const texmlController = require('./controllers/texmlController');

app.use(express.json());
app.use(texmlPath, express.urlencoded({ extended: true }), texmlController);

const port = process.env.PORT || 3000;
http.listen(port);
console.log(`Server listening on port: ${port}`);
