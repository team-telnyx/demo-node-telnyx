const express  = require('express');
const fs = require('fs');
const url = require('url');
const telnyx = require('telnyx')(process.env.TELNYX_API_KEY);
const router = module.exports = express.Router();

const toBase64 = data => (new Buffer.from(data)).toString('base64');
const fromBase64 = data => (new Buffer.from(data, 'base64')).toString();

const mathPrompt = "What is 2 plus 2? Please press star once you have answered";

const answerController = (req, res) => {
  console.log(req.body);
  const TeXML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather action="gather" finishOnKey="*" timeout="20">
        <Say>${mathPrompt}</Say>
    </Gather>
   <Say>We did not receive any input. Goodbye!</Say>
</Response>`;
  res.type("application/xml").send(TeXML);
}

const gatherController = (req, res) => {
  console.log(req.body);
  const event = req.body;
  const digits = event.Digits;
  const TeXML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">You pressed ${digits}, the correct answer was four.</Say>
</Response>`;
  res.type("application/xml").send(TeXML);
}


router.route('/gather')
  .post(gatherController)

router.route('/answer')
    .post(answerController)