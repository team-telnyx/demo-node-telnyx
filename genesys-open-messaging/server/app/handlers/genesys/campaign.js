const telnyx = require("telnyx")(process.env.TELNYX_API_KEY);
const debugTelnyx = require("debug")("app:Telnyx");
const debugGenesys = require("debug")("app:Genesys");
const platformClient = require("purecloud-platform-client-v2");
const axios = require("axios");
const csvtojson = require("csvtojson/v2");

const outboundApiInstance = new platformClient.OutboundApi();
const conversationsApiInstance = new platformClient.ConversationsApi();

const campaignStart = async (req, res) => {
  const { contactListId, campaignType, template, contactListColumns } =
    req.body;
  const token = req.app.locals.accessToken;

  try {
    debugGenesys(
      `Starting ${campaignType} campaign for contact list ID: ${contactListId}`
    );

    debugGenesys("Exporting contact list...");
    const exportedContactList =
      await outboundApiInstance.postOutboundContactlistExport(contactListId);
    debugGenesys("GC contact list export response:");
    debugGenesys(exportedContactList);

    debugGenesys("Getting contact list export file uri...");
    let opts = {
      download: "false",
    };
    const responseUri = await outboundApiInstance.getOutboundContactlistExport(
      contactListId,
      opts
    );
    const url = responseUri.uri;

    debugGenesys("Getting GC contact list export file...");
    let config = {
      method: "GET",
      responseType: "blob",
      url,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios(config);

    const contacts = await csvtojson({
      noheader: false,
      output: "json",
    }).fromString(response.data);

    debugGenesys(`GC contact list fetched with ${contacts.length} contacts`);

    if (campaignType === "SMS") {
      for (let i = 0; i < contacts.length; i++) {
        let message = template;
        for (let j = 0; j < contactListColumns.length; j++) {
          message = message.replace(
            "{{" + contactListColumns[j] + "}}",
            contacts[i][contactListColumns[j]]
          );
        }

        const data = {
          fromAddress: process.env.GC_MESSAGE_DEPLOYMENT_ID,
          toAddress:
            contacts[i].Number +
            "|" +
            contactListId +
            "|" +
            contacts[i]["inin-outbound-id"],
          toAddressMessengerType: "open",
          textBody: message,
          useExistingActiveConversation: false,
        };
        debugGenesys(`Sending GC agentless message no. ${i + 1}...`);
        const response =
          await conversationsApiInstance.postConversationsMessagesAgentless(
            data
          );
        debugGenesys("GC send agentless message response:");
        debugGenesys(response.message);
      }
    } else {
      let type = [];
      type.push("carrier");
      type.push("caller-name");

      for (let i = 0; i < contacts.length; i++) {
        const result = await telnyx.numberLookup.retrieve(contacts[i].Number, {
          type,
        });
        debugTelnyx("Number Lookup Result");
        debugTelnyx(result);

        const contact = await outboundApiInstance.putOutboundContactlistContact(
          contactListId,
          contacts[i]["inin-outbound-id"],
          {
            data: {
              Number: contacts[i].Number,
              NationalFormat: result.data.national_format,
              CountryCode: result.data.country_code,
              MobileCountryCode: result.data.carrier.mobile_country_code,
              MobileNetworkCode: result.data.carrier.mobile_network_code,
              CarrierName: result.data.carrier.name,
              Type: result.data.carrier.type,
              ValidNumber: result.data.valid_number,
              CallerName: result.data?.caller_name?.caller_name
                ? result.data.caller_name.caller_name
                : "",
            },
          }
        );
        debugGenesys("GC contact update response:");
        debugGenesys(contact, "\n");
      }
    }
    return res.status(200).send({ message: "Campaign started successfully" });
  } catch (error) {
    debugGenesys(`Error processing ${campaignType} campaign:`);
    debugGenesys(error);
    return res.status(400).send({ message: error.message });
  }
};

module.exports = {
  campaignStart,
};
