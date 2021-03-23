## Start out

* Create an outbound voice profile
* Create 2x SIP connections
  * Assign OVP to SIP connection
+ Create a TeXML application
  * Assign OVP to TeXML Application
* Order a phone number
  * Assign TeXML application to phone number
* Record a voicemail
  * Upload to Amazon (or something similar)

## Index.js

Start out with a basic express application.

```js
require('dotenv').config()
const express = require('express');
const app = express();
const http = require('http').createServer(app);
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World 👋 🌎');
})


const port = process.env.PORT || 3000;
http.listen(port);
console.log(`Server listening on port: ${port}`);
```


## Database.json

For demo's sake, we're using a `.json` file as our database. In a production environment you'd want to stand up a 'real' DB; any will do.

Update the database.json with the

```json
[
  {
    "phoneNumber": "+19192058844",
    "voicemailUrl": "https://yourS3.amazonaws.com/vmGreeting.wav",
    "sip": [
      "hello@sip.telnyx.com",
      "world@sip.telnyx.com"
    ],
    "pstn": [
      "+19198675309"
    ]
  }
]
```

### db.js

Small function to lookup the user record by the **TELNYX** phone number.

```js
const database = require("./database.json")

module.exports.lookupUserByPhoneNumber = phoneNumber => database.filter(row => row.phoneNumber === phoneNumber)
      .reduce((result, row) => result = row, {});
```

### Texml Controller

Need some controller logic to handle callbacks. Let's add an endpoint and inspect the request

```js
const express  = require('express');
const router = module.exports = express.Router();
const db = require('../models/db');
const texml = require('../packages/texml');

const inboundPSTNAnswerController = async (req, res) => {
  console.log(req.body);
  const event = req.body;
  res.sendStatus(200);
};

router.route('/inbound')
  .post(inboundPSTNAnswerController);
```

#### Update index.js

```js
const texmlController = require('./controllers/texmlController');
const texmlPath = '/texml';
app.use(texmlPath, express.urlencoded({ extended: true }), texmlController);
```

#### Final index.js

```js
require('dotenv').config()
const express = require('express');
const app = express();
const http = require('http').createServer(app);
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World 👋 🌎');
})

const texmlController = require('./controllers/texmlController');
const texmlPath = '/texml';
app.use(texmlPath, express.urlencoded({ extended: true }), texmlController);

const port = process.env.PORT || 3000;
http.listen(port);
console.log(`Server listening on port: ${port}`);
```


### Texml Package

We'll create a small interfaced to generate our TeXML

```js
const xmlFormat = require('xml-formatter');

module.exports.gatherTeXML = gatherPrompt => xmlFormat(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather action="gather" numDigits="1">
        <Say voice="alice">${gatherPrompt}</Say>
    </Gather>
   <Say>We did not receive any input. Goodbye!</Say>
</Response>`);
```

### Build it out

#### Update inbound controller

```js
const inboundPSTNAnswerController = async (req, res) => {
  const defaultGatherSentence = 'Hello, please press 1 to connect to sales or 2 to leave a voicemail';
  console.log(req.body);
  const event = req.body;
  res.type("application/xml");
  res.send(texml.gatherTeXML(defaultGatherSentence));
};
```

#### Add transfer TeXML interface

```js
module.exports.transferTeXML = (greeting, sip, pstn) => {
  const sipTexmlList = sip.length > 0 ? sip.reduce((sipList, sipDestination) => `${sipList}<Sip>sip:${sipDestination}</Sip>`, '') : '',
      pstnTexmlList = pstn.length > 0 ? pstn.reduce((pstnList, pstnDestination) => `${pstnList}<Number>${pstnDestination}</Number>`, '') : '';
  return xmlFormat(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${greeting}</Say>
  <Dial action="dialFinished">${sipTexmlList}${pstnTexmlList}</Dial>
  <Hangup/>
</Response>`);
};
```

#### Add hangup TeXML interface


```js
module.exports.hangupTeXML = hangupSentence => xmlFormat(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${hangupSentence}</Say>
  <Hangup/>
</Response>`);
```

#### Add gather controller

```js
const gatherController = async (req, res) => {
  const transferGreeting = 'Thank you, connecting you now';
  console.log(req.body);
  const event = req.body;
  const digits = parseInt(event.Digits);
  const userRecord = db.lookupUserByPhoneNumber(event.To);
  res.type("application/xml");
  switch (digits) {
    case 1:
      res.send(texml.transferTeXML(transferGreeting, userRecord.sip, userRecord.pstn));
      break;
    case 2:
      res.send(texml.recordTeXML(userRecord.voicemailUrl));
      break;
    default:
      res.send(texml.hangupTeXML(hangupSentence));
      break;
  }
};

router.route('/gather')
  .post(gatherController);
```

#### Add Record TeXML interface

```js
module.exports.recordTeXML = url => xmlFormat(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${url}</Play>
  <Record action="recordFinished" recordingStatusCallback="recordStatus" playBeep=true/>
</Response>`);
```

#### Add Recording Controllers

```js
const recordFinishedController = async (req, res) => {
  console.log(req.body);
  const event = req.body;
  res.type("application/xml");
  res.send(texml.hangupTeXML(hangupSentence));
};

const recordStatusController = async (req, res) => {
  console.log(req.body);
  const event = req.body;
  res.sendStatus(200);
};

router.route('/recordFinished')
    .post(recordFinishedController);

router.route('/recordStatus')
    .post(recordStatusController);
```

#### Add End of call controller

```js
const dialFinishedController = async (req, res) => {
  console.log(req.body);
  const event = req.body;
  res.type("application/xml");
  res.send(texml.hangupTeXML(hangupSentence));
};

router.route('/dialFinished')
    .post(dialFinishedController);
```

### Final texml.js

```js
const xmlFormat = require('xml-formatter');

module.exports.gatherTeXML = gatherPrompt => xmlFormat(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather action="gather" numDigits="1">
        <Say voice="alice">${gatherPrompt}</Say>
    </Gather>
   <Say>We did not receive any input. Goodbye!</Say>
</Response>`);

module.exports.recordTeXML = url => xmlFormat(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${url}</Play>
  <Record action="recordFinished" recordingStatusCallback="recordStatus" playBeep=true/>
</Response>`);

module.exports.hangupTeXML = hangupSentence => xmlFormat(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${hangupSentence}</Say>
  <Hangup/>
</Response>`);

module.exports.transferTeXML = (greeting, sip, pstn) => {
  const sipTexmlList = sip.length > 0 ? sip.reduce((sipList, sipDestination) => `${sipList}<Sip>sip:${sipDestination}</Sip>`, '') : '',
      pstnTexmlList = pstn.length > 0 ? pstn.reduce((pstnList, pstnDestination) => `${pstnList}<Number>${pstnDestination}</Number>`, '') : '';
  return xmlFormat(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${greeting}</Say>
  <Dial action="dialFinished">${sipTexmlList}${pstnTexmlList}</Dial>
  <Hangup/>
</Response>`);
};
```

### Final texmlController.js

```js
const express  = require('express');
const router = module.exports = express.Router();
const db = require('../models/db');
const texml = require('../packages/texml');


const hangupSentence = 'Thank you for the call, hanging up';

const inboundPSTNAnswerController = async (req, res) => {
  const defaultGatherSentence = 'Hello, please press 1 to connect to sales or 2 to leave a voicemail';
  console.log(req.body);
  const event = req.body;
  res.type("application/xml");
  res.send(texml.gatherTeXML(defaultGatherSentence));
};

const gatherController = async (req, res) => {
  const transferGreeting = 'Thank you, connecting you now';
  console.log(req.body);
  const event = req.body;
  const digits = parseInt(event.Digits);
  const userRecord = db.lookupUserByPhoneNumber(event.To);
  res.type("application/xml");
  switch (digits) {
    case 1:
      res.send(texml.transferTeXML(transferGreeting, userRecord.sip, userRecord.pstn));
      break;
    case 2:
      res.send(texml.recordTeXML(userRecord.voicemailUrl));
      break;
    default:
      res.send(texml.hangupTeXML(hangupSentence));
      break;
  }
};

const recordFinishedController = async (req, res) => {
  console.log(req.body);
  const event = req.body;
  res.type("application/xml");
  res.send(texml.hangupTeXML(hangupSentence));
};

const recordStatusController = async (req, res) => {
  console.log(req.body);
  const event = req.body;
  res.sendStatus(200);
};

const dialFinishedController = async (req, res) => {
  console.log(req.body);
  const event = req.body;
  res.type("application/xml");
  res.send(texml.hangupTeXML(hangupSentence));
};

router.route('/inbound')
  .post(inboundPSTNAnswerController);

router.route('/gather')
  .post(gatherController);

router.route('/recordFinished')
    .post(recordFinishedController);

router.route('/recordStatus')
    .post(recordStatusController);

router.route('/dialFinished')
    .post(dialFinishedController);
```