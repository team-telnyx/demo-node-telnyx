if (!process.env.TELNYX_API_KEY) {
  console.error("Please set the environmental variable: TELNYX_API_KEY");
  process.exit();
}

if (!process.env.TELNYX_PUBLIC_KEY) {
  console.error("Please set the environmental variable: TELNYX_PUBLIC_KEY");
  process.exit();
}

if (!process.env.AWS_PROFILE) {
  console.error("Please set the environmental variable: AWS_PROFILE");
  process.exit();
}

if (!process.env.AWS_REGION) {
  console.error("Please set the environmental variable: AWS_REGION");
  process.exit();
}

if (!process.env.TELNYX_MMS_S3_BUCKET) {
  console.error("Please set the environmental variable: TELNYX_MMS_S3_BUCKET");
  process.exit();
}


module.exports.TELNYX_API_KEY       = process.env.TELNYX_API_KEY;
module.exports.TELNYX_PUBLIC_KEY    = process.env.TELNYX_PUBLIC_KEY;
module.exports.TELNYX_APP_PORT      = process.env.TELNYX_APP_PORT || 8000;
module.exports.AWS_PROFILE          = process.env.AWS_PROFILE;
module.exports.AWS_REGION           = process.env.AWS_REGION;
module.exports.TELNYX_MMS_S3_BUCKET = process.env.TELNYX_MMS_S3_BUCKET;
