require('dotenv').config()


const { uniqueNamesGenerator, colors, animals } = require('unique-names-generator');
const randomName = () => uniqueNamesGenerator({dictionaries: [colors, animals]})+`.xml`;
// console.log(randomName());
//
const AWS = require('aws-sdk');
AWS.config.update({region: process.env.AWS_REGION});

const uploadTexml = async texml => {
  const s3 = new AWS.S3({apiVersion: '2006-03-01'});
  const bucketName = process.env.TELNYX_MMS_S3_BUCKET;
  const fileName = randomName();
  const s3UploadParams = {
    Bucket: bucketName,
    Key: fileName,
    ContentType: 'application/xml',
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

const main = async () => {
  const path  = await uploadTexml('<Response></Response>');
  console.log(path);
}

main()

