require('dotenv').config()

const TELNYX_PUBLIC_KEY = process.env.TELNYX_PUBLIC_KEY
const TELNYX_API_KEY = process.env.TELNYX_API_KEY
const TELNYX_APP_PORT = 8000
const telnyx = require('telnyx')(TELNYX_API_KEY);

const myNumber = process.env.MY_NUMBER;

const sendMessage = async () => {
  try {
    const messageRequest = {
      from: "+19842550944",
      to: myNumber,
      text: '👋 Hello World'
    }

    const telnyxResponse = await telnyx.messages.create(messageRequest);
    console.log(`Sent message with id: ${telnyxResponse.data.id}`);
  }
  catch (e)  {
    console.log('Error sending message');
    console.log(e);
  }
}

async function main () {
  await sendMessage();
}

main();