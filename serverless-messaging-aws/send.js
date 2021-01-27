import dynamoDb from "./libs/dynamodb-lib";
const telnyx = require('telnyx')(process.env.telnyx_api_key);
const urljoin = require('url-join');

export async function main(event, context) {

    // Read in body
    const data = JSON.parse(event.body);
    let body, statusCode;

    // Check for auth
    if (!event.headers.Authorization) {
        body = { error: "No credentials provided. Please use 'Basic' encoded https authorization." };
        statusCode = 401;
    } else {

        // Check creds and flag if incorrect
        let valid_creds = false;
        let incorrect_creds = false;
        try {
            let creds = Buffer.from(event.headers.Authorization.split(" ")[1], 'base64').toString().split(":");
            let username = creds[0];
            let password = creds[1];
            if (username == process.env.auth_username && password == process.env.auth_password) {
                valid_creds = true;
            } else {
                incorrect_creds = true;
            }
        } catch (e) {
            body = { error: "Invalid credential format. Please use 'Basic' encoded https authorization." };
            statusCode = 401;
        }

        let outbound_url = null;
        let apiId = event.requestContext?.apiId;

        // Generate url for outbound status updates
        if (apiId && process.env.AWS_REGION && process.env.stage) {
            outbound_url = urljoin("https://", apiId + ".execute-api." + process.env.AWS_REGION + ".amazonaws.com", process.env.stage, "telnyx/callbacks/outbound");
            console.log(outbound_url);
        }

        // Send the message if properly authenticated
        if (valid_creds) {
            try {
                // Run the Lambda
                body = await telnyx.messages.create({
                    'from': data.from_number, // Your Telnyx number
                    'to': data.to_number,
                    'text': data.text,
                    'webhook_url': outbound_url,
                    'use_profile_webhooks': false,
                    'media_urls': data.media_urls
                });

                // Add successful message to the DynamoDB database
                const params = {
                    TableName: process.env.message_table_name,
                    Item: {
                        // The attributes of the item to be created
                        messageId: body.data.id,
                        content: body.data
                    },
                };

                await dynamoDb.put(params);

                statusCode = 200;
            } catch (e) {
                body = { error: e.message };
                statusCode = 500;
            }
        } else if (incorrect_creds) {
            body = { error: "Incorrect username or password." };
        }
    }


    // Return HTTP response
    return {
        statusCode,
        body: JSON.stringify(body),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        },
    };
};