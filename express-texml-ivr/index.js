require('dotenv').config()
const express = require('express');
const app = express();
const http = require('http').createServer(app);
app.use(express.json());

app.route('/hello', (req, res) => {
    res.send('world');
})

const texmlController = require('./controllers/texmlController');
const texmlPath = '/texml';
app.use(texmlPath, express.urlencoded({ extended: true }), texmlController);

const port = process.env.PORT || 3000;
http.listen(port);
console.log(`Server listening on port: ${port}`);
