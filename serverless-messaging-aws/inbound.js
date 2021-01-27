import * as uuid from "uuid";
import handler from "./libs/handler-lib";
import dynamoDb from "./libs/dynamodb-lib";

export const main = handler(async (event, context) => {
    const parsedEvent = JSON.parse(event.body);
    const data = parsedEvent.data;
    const number = data.payload.from.phone_number;
    const text = data.payload.text;

    const params = {
        TableName: process.env.inbound_message_table_name,
        Item: {
            // The attributes of the item to be created
            id: uuid.v1(),
            complete_status: data,
            text: text,
            from: number
        },
    };

    await dynamoDb.put(params);

    return { status: true };
});