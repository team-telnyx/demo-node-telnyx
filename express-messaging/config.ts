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

export const TELNYX_API_KEY = process.env.TELNYX_API_KEY;
export const TELNYX_PUBLIC_KEY = process.env.TELNYX_PUBLIC_KEY;
export const TELNYX_APP_PORT = process.env.TELNYX_APP_PORT || 8000;
export const AWS_PROFILE = process.env.AWS_PROFILE;
export const AWS_REGION = process.env.AWS_REGION;
export const TELNYX_MMS_S3_BUCKET = process.env.TELNYX_MMS_S3_BUCKET;
