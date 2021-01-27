import * as uuid from "uuid";
import handler from "./libs/handler-lib";
import dynamoDb from "./libs/dynamodb-lib";

export const main = handler(async (event, context) => {
    const data = JSON.parse(event.body);
    const params = {
        TableName: process.env.outbound_status_table_name,
        Item: {
            // The attributes of the item to be created
            id: uuid.v1(),
            status: data
        },
    };

    await dynamoDb.put(params);

    return params.Item;
});