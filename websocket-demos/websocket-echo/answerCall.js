/**
 * Sends a request to the Telnyx API to answer a specific incoming call identified by its Call Control ID. 
 * This function configures the call response to include streaming audio data to a specified URL and sets the preferred audio codecs for the stream.
 * It leverages the axios library for sending the HTTP POST request to the Telnyx API.
 *
 * @param {string} callControlId The unique identifier for the call that is to be answered, as provided by Telnyx.
 * @param {string} CLIENT_STATE A base64 encoded string that represents an arbitrary client state. This state is echoed back in webhook events related to this call.
 * @param {string} COMMAND_ID A unique identifier for the command to ensure idempotency of the request.
 * @param {string} TELNYX_STREAM_URL The URL to which Telnyx will stream audio data from the call.
 * @param {Object} API_HEADERS The HTTP headers to be sent with the request, typically including authorization and content type.
 *
 * Upon execution, the function logs a message with the HTTP status code of the response to indicate a successful API call.
 * If the request fails, it catches and logs the error, including any API response data available or the error message.
 * This ensures that any issues during the call answering process can be diagnosed and addressed promptly.
 */

import axios from 'axios';

export async function answerCall(callControlId, CLIENT_STATE, COMMAND_ID, TELNYX_STREAM_URL, API_HEADERS) {
    const url = `https://api.telnyx.com/v2/calls/${callControlId}/actions/answer`;
    const data = {
        "client_state": CLIENT_STATE,
        "command_id": COMMAND_ID,
        "stream_url": TELNYX_STREAM_URL,
        "stream_track": "inbound_track",
        "preferred_codecs": "PCMU"
    };

    try {
        const response = await axios.post(url, data, { headers: API_HEADERS });
        console.log(`Answer Call Request successful for ID: ${callControlId}. Status code: ${response.status}`);
    } catch (error) {
        console.error(`Failed to answer call for ${callControlId}.`, error.response?.data || error.message);
    }
}