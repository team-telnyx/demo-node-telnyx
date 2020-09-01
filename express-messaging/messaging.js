const express  = require('express');
const config = require('./config');
const fs = require('fs');
const axios = require('axios');
const AWS = require('aws-sdk');
const path = require('path');
AWS.config.update({region: config.AWS_REGION});


const telnyx = require('telnyx')(config.TELNYX_API_KEY);
const router = module.exports = express.Router();
const url = require('url');

const toBase64 = data => (new Buffer.from(data)).toString('base64');
const fromBase64 = data => (new Buffer.from(data, 'base64')).toString();


const outboundMessageController = async (req, res) => {
  res.sendStatus(200); // Play nice and respond to webhook
  const event = req.body.data;
  console.log(`Received message DLR with ID: ${event.payload.id}`)
}

const uploadFile = async filePath => {
  const s3 = new AWS.S3({apiVersion: '2006-03-01'});
  const bucketName = config.TELNYX_MMS_S3_BUCKET;
  const fileName = path.basename(filePath);
  const fileStream = fs.createReadStream(filePath);
  return new Promise(async (resolve, reject) => {
    fileStream.once('error', reject);
    try {
      const s3UploadParams = {
        Bucket: bucketName,
        Key: fileName,
        Body: fileStream,
        ACL: 'public-read'
      }
      await s3.upload(s3UploadParams).promise();
      resolve(`https://${bucketName}.s3.amazonaws.com/${fileName}`);
    }
    catch (e) {
      reject(e);
    }
  });
};

const downloadFile = async url => {
  const fileLocation = path.resolve(__dirname, url.substring(url.lastIndexOf('/')+1));
  const response = await axios({
    method: "get",
    url: url,
    responseType: "stream"
  });
  response.data.pipe(fs.createWriteStream(fileLocation));
  return new Promise((resolve, reject) => {
    response.data.on('end', () => {resolve(fileLocation)} );
    response.data.on('error', reject);
  });
};

const inboundMessageController = async (req, res) => {
  res.sendStatus(200); // Play nice and respond to webhook
  const event = req.body.data;
  console.log(`Received inbound message with ID: ${event.payload.id}`)
  const dlrUrl = (new URL('/messaging/outbound', `${req.protocol}://${req.hostname}`)).href;
  const toNumber = event.payload.to[0].phone_number;
  const fromNumber = event.payload['from'].phone_number;
  const medias = event.payload.media;
  const mediaPromises = medias.map(async media => {
    const fileName = await downloadFile(media.url)
    return uploadFile(fileName);
  });
  const mediaUrls = await Promise.all(mediaPromises);
  try {
    const messageRequest = {
      from: toNumber,
      to: fromNumber,
      text: '👋 Hello World',
      media_urls: mediaUrls,
      webhook_url: dlrUrl,
      use_profile_webhooks: false
    }

    const telnyxResponse = await telnyx.messages.create(messageRequest);
    console.log(`Sent message with id: ${telnyxResponse.data.id}`);
  }
  catch (e)  {
    console.log('Error sending message');
    console.log(e);
  }

}

router.route('/inbound')
    .post(inboundMessageController)

router.route('/outbound')
    .post(outboundMessageController)