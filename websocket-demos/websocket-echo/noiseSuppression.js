/**
 * Provides functionality to control noise suppression on calls via the Telnyx API. 
 * These functions interact with the Telnyx API to start and stop noise suppression for a specific call, 
 * Identified by its Call Control ID. They use environment variables for configuration and axios for HTTP requests.
 *
 * startNoiseSuppression:
 * Initiates noise suppression on an active call. It sends a request to the Telnyx API to start suppressing noise for a call identified by the given Call Control ID, using provided client state and command ID for operation tracking and idempotency.
 * 
 * @param {string} callControlId The unique identifier for the call, provided by Telnyx.
 * @param {string} CLIENT_STATE A base64 encoded string representing an arbitrary client state that will be echoed back in webhook events related to this call.
 * @param {string} COMMAND_ID A unique identifier for the command, ensuring idempotency.
 * @param {Object} API_HEADERS HTTP headers for the request, typically including authorization details.
 *
 * stopNoiseSuppression:
 * Stops noise suppression on an active call. 
 * Similar to startNoiseSuppression it sends a request to Telnyx to stop noise suppression
 * Using the same parameters to identify the call and ensure command idempotency.
 * 
 * Both functions log success or failure messages to the console, providing clear feedback on the operation's outcome. 
 * They encapsulate error handling for API request issues, 
 * Logging detailed error information to assist in debugging and monitoring.
 */

import axios from 'axios';
import 'dotenv/config';

export async function startNoiseSuppression(callControlId, CLIENT_STATE, COMMAND_ID, API_HEADERS) {
    const url = `https://api.telnyx.com/v2/calls/${callControlId}/actions/suppression_start`;
    const data = {
        client_state: CLIENT_STATE,
        command_id: COMMAND_ID,
        direction: "inbound"
    };

    try {
        await axios.post(url, data, { headers: API_HEADERS });
        console.log(`Noise suppression started for call ${callControlId}.`);
    } catch (error) {
        console.error(`Failed to start noise suppression for call ${callControlId}.`, error.response?.data || error.message);
    }
}

export async function stopNoiseSuppression(callControlId, CLIENT_STATE, COMMAND_ID, API_HEADERS) {
    const url = `https://api.telnyx.com/v2/calls/${callControlId}/actions/suppression_stop`;
    const data = {
        client_state: CLIENT_STATE,
        command_id: COMMAND_ID
    };

    try {
        await axios.post(url, data, { headers: API_HEADERS });
        console.log(`Noise suppression stopped for call ${callControlId}.`);
    } catch (error) {
        console.error(`Failed to stop noise suppression for call ${callControlId}.`, error.response?.data || error.message);
    }
};
