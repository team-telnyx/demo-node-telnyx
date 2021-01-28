
# Serverless Telnyx Messaging Starter

For more information on serverless please see the [Serverless Stack](http://serverless-stack.com) guide.

Demo video [here]().
Walkthrough Setup Tutorial Video [here]().

### Tutorial Pre-reqs

*  [Install the Serverless Framework](https://serverless.com/framework/docs/providers/aws/guide/installation/)

*  [Create an IAM User with AdministratorAccess in AWS ](https://serverless-stack.com/chapters/create-an-iam-user.html)
    * Take note of the `Access Key ID` and `Secret Key`, they are used when setting up AWS CLI in terminal
*  [Configure your AWS CLI](https://serverless-stack.com/chapters/configure-the-aws-cli.html)
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

Clone the repo 
```bash
$ git clone https://github.com/team-telnyx/demo-node-telnyx.git
$ cd demo-node-telnyx/serverless-messaging-aws
```

Install the Node.js packages
``` bash
$ npm install
```
Ensure the AWS CLI is setup correctly.
```bash
$ pip install awscli
$ aws configure
```
This will prompt you to enter your [IAM User](https://serverless-stack.com/chapters/create-an-iam-user.html) attributes `Access Key ID` and `Secret Key`. You can just leave the region and output format blank during the setup.
### Project Setup
Create a `serverless.yml` file based on the `serverless.yml.example` file and add replace the following information:
* `YOUR_MESSAGE_TABLE_NAME` - This is the name of the table created in DynamoDB to store messages sent through the `/messages` POST endpoint.
* `YOUR_OUTBOUND_STATUS_TABLE_NAME` - This is the name of the table created in DynamoDB to store outbound message status information.
* `YOUR_INBOUND_MESSAGE_TABLE_NAME` - This is the name of the table created in DynamoDB to store inbound messages received by your Telnyx number.
* `YOUR_TELNYX_API_KEY` - This is your secure API key from the [Telnyx Portal](https://portal.telnyx.com/#/app/api-keys).

Also make sure to change your region to your AWS account region. The example file has it set as `us-east-1` in several places. Make sure to replace each instance in this file with your region.

NOTE: The stage (dev or prod) is set under the provider: stage and provider: environment: stage. This is used for the generation of the endpoint urls to keep the environments separate. Ensure the changes in both places when migrating stages.

You can also change the `username` and  `password` that is setup as a basic auth for the endpoint. When testing, you must use those credentials to ensure that access is allowed.
### Deployment
Deploy your project to AWS
``` bash
$ serverless deploy
```
Output endpoints should look something like:
``` bash
POST - https://i3twermzeg.execute-api.us-east-2.amazonaws.com/dev/messages
GET - https://i3twermzeg.execute-api.us-east-2.amazonaws.com/dev/messages/{id}
GET - https://i3twermzeg.execute-api.us-east-2.amazonaws.com/dev/messages
POST - https://i3twermzeg.execute-api.us-east-2.amazonaws.com/dev/telnyx/callbacks/inbound
POST - https://i3twermzeg.execute-api.us-east-2.amazonaws.com/dev/telnyx/callbacks/outbound
```
Deploy a single function
``` bash
$ serverless deploy function  --function inbound
```  

### Testing
To run a function on your local machine using a mock imitating a json input to the function, replace `function-name` with the name of the function to test as configured in the `serverless.yml` file. Replace `function-event` with the one created in the mocks directory as the input event to the function.

``` bash
$ serverless invoke local --function {function-name} --path mocks/{function-event}.json
```

### Testing the Deployed REST API
After deployment, you should receive endpoint URLs that you can begin testing. We recommend [Postman](https://www.postman.com/) for thoroughly testing these endpoints.

### Required attributes for each endpoint
Ensure BASIC Authorization with matching `username` and `password` as configured in the `serverless.yml` file.

POST /Messages (sending a message with the Telnyx API)
`to_number` - phone number to send the text to
`from_number` - a telnyx phone number associated with your account
`text` - the text content of the message to send
`media_urls` - an array of media urls to send (images, etc.)

GET /Messages (retrieve a list of messages with optional limit)
Query Parameter `limit` - the limit on amount of messages to retrieve. (Example GET Url `https://i3twermzeg.execute-api.us-east-2.amazonaws.com/dev/messages?limit=5`)

GET /Messages/{id}
`id` in the URL is the messageId of the message you want to retrieve

POST /telnyx/callbacks/inbound
Object must be a valid Telnyx inbound message object

POST /telnyx/callbacks/outbound
Object must be a valid Telnyx outbound status update object
