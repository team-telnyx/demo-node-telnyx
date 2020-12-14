require('dotenv').config()

const express = require('express');

const texmlPath = '/texml';

const app = express();
const http = require('http').createServer(app);

const texmlController = (req, res) => {
  const texml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather action="/processdtmf.php" finishOnKey="*" timeout="20">
        <Say>Please press 1 for sales, or 2 for support. Press * to exit the menu.</Say>
    </Gather>
   <Say>We did not receive any input. Goodbye!</Say>
   <Redirect method="POST">/noResponse</Redirect>
</Response>`;
  res.send(texml);
}

app.use(texmlPath, express.urlencoded({ extended: true }), texmlController);
app.post('/processdtmf', (req, res) => {
  console.log(req.body);
});

app.post('/noResponse', (req, res) => {
  console.log(req.body);
  const texml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
   <Say>Speaking back to you from the no response</Say>
</Response>`;
  res.send(texml);
});

const port = process.env.PORT || 3000;
http.listen(port);
console.log(`Server listening on port: ${port}`);