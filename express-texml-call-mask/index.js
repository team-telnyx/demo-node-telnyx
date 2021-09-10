require('dotenv').config()
const express = require('express');
const app = express();
const http = require('http').createServer(app);

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World 👋 🌎');
})

const dtmfDialController = require('./controllers/dtmfDialController');
const dtmfDialPath = '/dtmfDial';
app.use(dtmfDialPath, express.urlencoded({ extended: true }), dtmfDialController);

const didDialController = require('./controllers/didDialController');
const didDialPath = '/didDial';
app.use(didDialPath, express.urlencoded({ extended: true }), didDialController);

const port = process.env.PORT || 3000;
http.listen(port);
console.log(`Server listening on port: ${port}`);
