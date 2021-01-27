import handler from "./libs/handler-lib";
import dynamoDb from "./libs/dynamodb-lib";

export const main = handler(async (event, context) => {

  // Check for creds
  if(!event.headers.Authorization){
    throw new Error("Please provide valid 'Basic' http credentials.");
  }

  // Ensure proper credentials
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

  // Perform the query to get the message requested
  const params = {
    TableName: process.env.message_table_name,
    // 'Key' defines the partition key of the item to be retrieved
    Key: {
      messageId: event.pathParameters.id, // The id of the message from the path
    },
  };

  const result = await dynamoDb.get(params);
  if (!result.Item) {
    throw new Error("Message not found.");
  }

  // Return the retrieved item
  return result.Item;
});