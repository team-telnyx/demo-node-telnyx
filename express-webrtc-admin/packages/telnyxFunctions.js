const telnyx = require('telnyx')(process.env.TELNYX_API_KEY);
const SIP_CONNECTION_ID = process.env.TELNYX_SIP_CONNECTION_ID;
const TELNYX_APP_NAME = process.env.TELNYX_APP_NAME
const errorLogger = require('../packages/utils').errorLogger;

/**
 * Creates a telephony credential: https://developers.telnyx.com/docs/api/v2/webrtc/Credentials#CreateTelephonyCredential
 * @param credentialName
 * @returns {Promise<{ok: boolean, error: *}|{data: *, id, ok: boolean}>}
 */
const createTelephonyCredential = async (credentialName) => {
  const createTelephonyCredentialsRequest = {
    name: credentialName,
    connection_id: SIP_CONNECTION_ID,
    tag: TELNYX_APP_NAME
  }
  try {
    const createTelephonyCredentialsResponse = await telnyx.telephonyCredentials.create(createTelephonyCredentialsRequest);
    return {
      ok: true,
      data: createTelephonyCredentialsResponse.data
    }
  }
  catch (e) {
    return errorLogger(createTelephonyCredential.name, e);
  }
}

/**
 * Creates a JWT Access token on a credential id: https://developers.telnyx.com/docs/api/v2/webrtc/Access-Tokens
 * @param telephonyCredentialId
 * @returns {Promise<{data: *, ok: boolean}|{ok: boolean, error: *}>}
 */
const createJWTFromCredential = async (telephonyCredentialId) => {
  try {
    const createTelephonyCredentialsJWTResponse = await telnyx.telephonyCredentials.retrieve(telephonyCredentialId);
    return {
      ok: true,
      data: createTelephonyCredentialsJWTResponse.data
    }
  }
  catch (e) {
    return errorLogger(createJWTFromCredential.name, e);
  }
}

module.exports.createJWTFromCredential = createJWTFromCredential;
module.exports.createTelephonyCredential = createTelephonyCredential;
