require('dotenv').config();
const axios = require('axios');

/**
 * Telnyx Outbound Dialer with Premium AMD using TeXML
 * Initiates calls using the TeXML API with premium answering machine detection
 */

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;
const TELNYX_ACCOUNT_SID = process.env.TELNYX_ACCOUNT_SID;
const TEXML_APP_URL = process.env.TEXML_APP_URL; // Your TeXML application URL
const FROM_NUMBER = process.env.TELNYX_PHONE_NUMBER;

// List of phone numbers to dial
const PHONE_NUMBERS_TO_DIAL = [
  '+14168305230', 
];

/**
 * Initiate an outbound TeXML call with premium AMD
 * @param {string} toNumber - Destination phone number in E.164 format
 * @param {string} fromNumber - Your Telnyx phone number
 */
async function makeTeXMLCall(toNumber, fromNumber) {
  try {
    const endpoint = `https://api.telnyx.com/v2/texml/Accounts/${TELNYX_ACCOUNT_SID}/Calls`;

    const response = await axios.post(
      endpoint,
      {
        ApplicationSid: process.env.TELNYX_APPLICATION_ID,
        To: toNumber,
        From: fromNumber,
        Url: TEXML_APP_URL, // TeXML will be fetched from this URL
        MachineDetection: 'DetectMessageEnd', // Enable answering machine detection
        DetectionMode: 'Premium', // Use premium AMD for better accuracy
        AsyncAmd: true, // Process AMD asynchronously in background
        AsyncAmdStatusCallback: `${TEXML_APP_URL}/status`, // Callback for AMD events
        MachineDetectionTimeout: 6100,
        StatusCallback: `${TEXML_APP_URL}/status`, // Status updates callback
        StatusCallbackMethod: 'POST'
      },
      {
        headers: {
          'Authorization': `Bearer ${TELNYX_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    console.log(`✓ Call initiated to ${toNumber}`);
    console.log(`  Call SID: ${response.data.sid || response.data.CallSid}`);
    return response.data;
  } catch (error) {
    console.error(`✗ Error calling ${toNumber}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Start the outbound dialer campaign
 */
async function startDialer() {
  console.log('=== Telnyx TeXML Outbound Dialer with Premium AMD ===');
  console.log(`From: ${FROM_NUMBER}`);
  console.log(`TeXML App URL: ${TEXML_APP_URL}`);
  console.log(`Account SID: ${TELNYX_ACCOUNT_SID}`);
  console.log(`Total calls to make: ${PHONE_NUMBERS_TO_DIAL.length}\n`);

  for (const phoneNumber of PHONE_NUMBERS_TO_DIAL) {
    try {
      await makeTeXMLCall(phoneNumber, FROM_NUMBER);

      // Add delay between calls to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Failed to dial ${phoneNumber}`);
    }
  }

  console.log('\n=== Dialer campaign completed ===');
}

// Run the dialer if executed directly
if (require.main === module) {
  startDialer().catch(console.error);
}

module.exports = { makeTeXMLCall, startDialer };
