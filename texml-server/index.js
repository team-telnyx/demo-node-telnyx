require('dotenv').config()

const express = require('express');
const nunjucks = require('nunjucks');
const bodyParser = require('body-parser');
const phone = require('phone');
const AWS = require('aws-sdk');
AWS.config.update({region: process.env.AWS_REGION});
const { uniqueNamesGenerator, colors, animals } = require('unique-names-generator');
const randomName = () => uniqueNamesGenerator({dictionaries: [colors, animals]})+`.xml`;


const uploadTexml = async texml => {
  const s3 = new AWS.S3({apiVersion: '2006-03-01'});
  const bucketName = process.env.TELNYX_MMS_S3_BUCKET;
  const fileName = randomName();
  const s3UploadParams = {
    Bucket: bucketName,
    Key: fileName,
    ContentType: 'text/xml',
    Body: Buffer.from(texml, 'binary'),
    ACL: 'public-read'
  };
  try {
    await s3.upload(s3UploadParams).promise();
    return {
      ok: true,
      texmlUrl: `https://${bucketName}.s3.amazonaws.com/${fileName}`
    };
  }
  catch (e) {
    return {
      ok: false,
      error: e
    };
  }
};

const texmlPath = '/texml';
const texmlController = async (req, res) => {
  const texml = req.body.texml.trim();
  const texmlS3 = await uploadTexml(texml);
  texmlS3.ok ?
    res.render('messagesuccess', {texmlUrl: texmlS3.texmlUrl}) :
    res.render('messageFailure', {error: texmlS3.error})
}

const app = express();

const http = require('http').createServer(app);
app.use(bodyParser.urlencoded({
  extended: true
}));

// Set default express engine and extension
app.engine('html', nunjucks.render);
app.set('view engine', 'html');

// configure nunjucks engine
nunjucks.configure('templates/views', {
  autoescape: true,
  express: app
});


// Simple page that can send a phone call
app.get('/', function (req, res) {
  res.render('messageform');
});

app.use(texmlPath, texmlController);

const port = process.env.PORT || 8000;
http.listen(port);
console.log(`Server listening on port: ${port}`);