
# Serverless Telnyx Messaging Starter

For more information on serverless please see the [Serverless Stack](http://serverless-stack.com) guide.

### Requirements

*  [Install the Serverless Framework](https://serverless.com/framework/docs/providers/aws/guide/installation/)

*  [Configure your AWS CLI](https://serverless.com/framework/docs/providers/aws/guide/credentials/)
* 3 [DynamoDB](https://aws.amazon.com/dynamodb/) Tables within your AWS Account (take note of their table names)
	* A table to store messages sent with our Telnyx Number (i.e. `message_table`)
		* IMPORTANT: Name the primary key: `messageId` (case sensitive)
	* A table to store messages received by our Telnyx Number (i.e. `inbound_message_table`)
		* IMPORTANT: Name the primary key: `id` (case sensitive)
	 * A table to store status updates for our outbound text messages (i.e. `outbound_status_table`)
		* IMPORTANT: Name the primary key: `id` (case sensitive)
* [Telnyx Account](https://telnyx.com/sign-up?utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link)
* [Telnyx Phone Number](https://portal.telnyx.com/#/app/numbers/my-numbers?utm_source=referral&utm_medium=github_referral&utm_campaign=cross-site-link)

### Installation

Install the Node.js packages
``` bash

$ npm install
```
### Project Setup
Create a `serverless.yml` file based on the `serverless.yml.example` file and add replace the following information:
* `YOUR_MESSAGE_TABLE_NAME` - This is the name of the table created in DynamoDB to store messages sent through the `/messages` POST endpoint.
* `YOUR_OUTBOUND_STATUS_TABLE_NAME` - This is the name of the table created in DynamoDB to store outbound message status information.
* `YOUR_INBOUND_MESSAGE_TABLE_NAME` - This is the name of the table created in DynamoDB to store inbound messages received by your Telnyx number.
* `YOUR_TELNYX_API_KEY` - This is your secure API key from the [Telnyx Portal](https://portal.telnyx.com/#/app/api-keys).

Note: Make sure to change your region to your AWS account region. The example file has it set as `us-east-1` in several places. Make sure to replace each instance in this file with your region.

NOTE: The `stage` (dev or prod) is set under the `provider: stage` and `provider: environment: stage`. This is used for the generation of the endpoint urls to keep the environments separate. Ensure the changes in both places when migrating stages.

### Usage
To run a function on your local replace `function-name` with the name of the function to test as configured in the `serverless.yml` file. Replace `function-event` with the one created in the mocks directory as the input event to the function.

``` bash
$ serverless invoke local --function {function-name} --path mocks/{function-event}.json
```
Deploy your project
``` bash
$ serverless deploy
```
Deploy a single function
``` bash
$ serverless deploy function  --function inbound
```