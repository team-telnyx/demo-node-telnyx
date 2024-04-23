const debugGenesys = require("debug")("app:Genesys");
const debugTelnyx = require("debug")("app:Telnyx");

const platformClient = require("purecloud-platform-client-v2");
const crypto = require("crypto");
const telnyx = require("telnyx")(process.env.TELNYX_API_KEY);

const outboundApiInstance = new platformClient.OutboundApi();
const conversationsApiInstance = new platformClient.ConversationsApi();

const sendOpenMessage = async (req, res) => {
  const { payload, event_type } = req.body.data;

  debugTelnyx(`Telnyx SMS API event received: ${event_type}`);
  debugTelnyx(payload);

  if (event_type === "message.received") {
    try {
      const currentTime = new Date();
      const body = {
        id: payload.id,
        channel: {
          type: "Private",
          messageId: payload.id,
          to: {
            id: process.env.GC_MESSAGE_DEPLOYMENT_ID,
          },
          from: {
            id: payload.from.phone_number,
            idType: "Phone",
          },
          time: currentTime.toISOString(),
          metadata: {
            customAttributes: {
              customerAccountId: "Customer Account ID",
              customerName: "John Doe",
            },
          },
        },
        type: "Text",
        text: payload.text,
        status: "Sent",
        isFinalReceipt: true,
        direction: "Inbound",
      };

      const response =
        await conversationsApiInstance.postConversationsMessagesInboundOpen(
          body
        );

      debugGenesys("GC sendOpenMessage response:");
      debugGenesys(response);
    } catch (error) {
      debugGenesys("Error sending Genesys Cloud open message:");
      debugGenesys(error.message);
    }
  } else {
    const tempArr = payload.tags;
    debugGenesys("Tags attached to SMS:");
    debugGenesys(tempArr);

    if (tempArr.length === 3) {
      try {
        const contacts =
          await outboundApiInstance.postOutboundContactlistContactsBulk(
            tempArr[1],
            [tempArr[2]]
          );
        debugGenesys("GC getContacts response:");
        debugGenesys(contacts, "\n");

        let data = contacts[0].data;
        data.TELNYX_STATUS = payload.to[0].status;
        data.TELNYX_TIME = payload.completed_at
          ? payload.completed_at
          : payload.sent_at;
        data.TELNYX_PRICE = payload.cost.amount;
        data.TELNYX_MESSAGE_ID = payload.id;
        data.TELNYX_MESSAGE = payload.text;

        const contact = await outboundApiInstance.putOutboundContactlistContact(
          tempArr[1],
          tempArr[2],
          {
            data,
          }
        );
        debugGenesys("GC contact update response:");
        debugGenesys(contact, "\n");
      } catch (error) {
        debugGenesys("GC contact update error:");
        debugGenesys(error.message);
      }
    }
  }
};

const receiveOpenMessage = async (req, res) => {
  const data = req.body;

  if (data.type === "Text") {
    debugGenesys(`Message received from GC Open Messaging:`);
    debugGenesys(data);

    const gcSignature = req.headers["x-hub-signature-256"];

    const hash = crypto
      .createHmac("sha256", process.env.GC_SECRET_TOKEN)
      .update(JSON.stringify(data))
      .digest("base64");

    if (`sha256=${hash}` === gcSignature) {
      const tempArr = data.channel.to.id.split("|");
      debugGenesys("Tags attached to the open message:");
      debugGenesys(tempArr);
      const payload = {
        from: process.env.TELNYX_FROM_NUMBER,
        to: tempArr[0],
        text: data.text,
        messaging_profile_id: process.env.TELNYX_MESSAGING_PROFILE_ID,
        tags: tempArr,
      };

      try {
        const result = await telnyx.messages.create(payload);
        debugTelnyx("SMS sent successfully:");
        debugTelnyx(result);

        if (tempArr.length === 3) {
          const contacts =
            await outboundApiInstance.postOutboundContactlistContactsBulk(
              tempArr[1],
              [tempArr[2]]
            );

          debugGenesys("GC getContacts response:");
          debugGenesys(contacts, "\n");

          let data = contacts[0].data;
          data.TELNYX_STATUS = result.data.to[0].status;
          data.TELNYX_TIME = result.data.received_at;
          data.TELNYX_PRICE = result.data.cost.amount;
          data.TELNYX_MESSAGE_ID = result.data.id;
          data.TELNYX_MESSAGE = result.data.text;

          const contact =
            await outboundApiInstance.putOutboundContactlistContact(
              tempArr[1],
              tempArr[2],
              {
                data,
              }
            );
          debugGenesys("GC contact update response:");
          debugGenesys(contact, "\n");
        }
      } catch (err) {
        debugTelnyx("Send SMS Error:", err);
      }
    } else {
      debugGenesys("GC message hash not validated!");
    }
  } else {
    debugGenesys(`Receipt received from GC Open Messaging:`);
    debugGenesys(data);
  }
};

const sendAgentlessMessage = async (req) => {
  const { senderId, number, text } = req.body;
  try {
    debugGenesys(`Sending GC agentless message...`);

    const data = {
      fromAddress: process.env.GC_MESSAGE_DEPLOYMENT_ID,
      toAddress: number,
      toAddressMessengerType: "open",
      textBody: text,
      useExistingActiveConversation: true,
    };

    debugGenesys("GC sendAgentlessMessage data:");
    debugGenesys(data);
    const response =
      await conversationsApiInstance.postConversationsMessagesAgentless(data);

    debugGenesys("GC sendAgentlessMessage response:");
    debugGenesys(response);
  } catch (error) {
    debugGenesys("Error sending GC agentless open message:");
    debugGenesys(error.message);
  }
};

module.exports = {
  sendOpenMessage,
  receiveOpenMessage,
  sendAgentlessMessage,
};
