import handler from "./libs/handler-lib";
import dynamoDb from "./libs/dynamodb-lib";

export const main = handler(async (event, context) => {

    // Check for creds
    if(!event.headers.Authorization){
        throw new Error("Please provide valid 'Basic' http credentials.");
    }

    // Check the provided username and password
    try {
        let creds = Buffer.from(event.headers.Authorization.split(" ")[1], 'base64').toString().split(":");
        let username = creds[0];
        let password = creds[1];
        if (username != process.env.auth_username || password != process.env.auth_password) {
            throw new Error("Username or password is incorrect.");
        }
    } catch (e) {
        throw new Error("Invalid credential format. Please provide valid 'Basic' http credentials.");
    }

    // Use provided limit or the default
    const limit = event.queryStringParameters?.limit ? event.queryStringParameters.limit : 50;

    if(limit < 1) {
        throw new Error("Limit must be a positive value.");
    }

    const params = {
        TableName: process.env.message_table_name
    };


    let result = await dynamoDb.scan(params);

    result = result.Items.slice(0, limit);

    // Return the matching list of items trimmed to fit the limit given or the default
    return result;
});