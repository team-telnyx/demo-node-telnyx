const debugGenesys = require("debug")("app:Genesys");
const platformClient = require("purecloud-platform-client-v2");
const axios = require("axios");
const csvtojson = require("csvtojson/v2");

const getContacts = async (req, res) => {
  const { contactListId, contacts } = req.body;
  debugGenesys(`Getting contacts from GC contact list ID ${contactListId} ...`);

  try {
    const apiInstance = new platformClient.OutboundApi();

    const response = await apiInstance.postOutboundContactlistContactsBulk(
      contactListId,
      contacts
    );

    debugGenesys("GC getContacts response:");
    debugGenesys(response, "\n");
    return res.status(200).send(response);
  } catch (error) {
    debugGenesys(
      `Error getting contacts from GC contact list ID ${contactListId}`
    );
    debugGenesys(error);
    return res.status(400).send({ message: error.message });
  }
};

const updateContact = async (req, res) => {
  const { contactListId, contactId, contact } = req.body;
  debugGenesys(req.body);

  debugGenesys(
    `Updating contact ID: ${contactId} in contact list ${contactListId} ...`
  );

  try {
    const apiInstance = new platformClient.OutboundApi();

    const response = await apiInstance.putOutboundContactlistContact(
      contactListId,
      contactId,
      contact
    );
    return res.status(200).send(response);
  } catch (error) {
    debugGenesys(`Error updating contact ID: ${contactId}`);
    debugGenesys(error);
    return res.status(400).send({ message: error.message });
  }
};

const addContacts = async (req, res) => {
  const { contactListId, contacts } = req.body;

  debugGenesys(`Adding contacts to GC contact list ID ${contactListId} ...`);

  try {
    const apiInstance = new platformClient.OutboundApi();

    const opts = {
      priority: false,
      clearSystemData: false,
      doNotQueue: true,
    };

    const response = await apiInstance.postOutboundContactlistContacts(
      contactListId,
      contacts,
      opts
    );

    debugGenesys(`GC addContacts inserted ${response.length} contacts`);
    return res.status(200).send(response);
  } catch (error) {
    debugGenesys(
      `Error adding contacts to GC contact list ID ${contactListId}`
    );
    debugGenesys(error);
    return res.status(400).send({ message: error.message });
  }
};

const getContactLists = async (req, res) => {
  const { listType } = req.body;
  debugGenesys(`Getting GC contact lists of type ${listType} ...`);

  try {
    const apiInstance = new platformClient.OutboundApi();

    let opts = {
      name: listType,
    };
    opts.pageSize = 100;

    const response = await apiInstance.getOutboundContactlists(opts);

    debugGenesys("GC getContactLists response:");
    debugGenesys(response, "\n");
    return res.status(200).send(response);
  } catch (error) {
    debugGenesys("Error getting GC contact lists:");
    debugGenesys(error);
    return res.status(400).send({ message: error.message });
  }
};

const getContactListUri = async (req, res) => {
  const { contactListId } = req.body;

  debugGenesys(
    `Getting GC contact list export uri for contact list ID ${contactListId} ...`
  );

  try {
    const apiInstance = new platformClient.OutboundApi();

    debugGenesys("Exporting contact list...");
    await apiInstance.postOutboundContactlistExport(contactListId);

    let opts = {
      download: "false", // String | Redirect to download uri
    };

    const response = await apiInstance.getOutboundContactlistExport(
      contactListId,
      opts
    );

    debugGenesys("GC getContactListUri response:");
    debugGenesys(response, "\n");
    return res.status(200).send(response);
  } catch (error) {
    debugGenesys(
      `Error getting GC contact list export uri for contact list ID ${contactListId}`
    );
    debugGenesys(error);
    return res.status(400).send({ message: error.message });
  }
};

const getContactListFile = async (req, res) => {
  const { url } = req.body;
  const accessToken = req.app.locals.accessToken;

  debugGenesys("Getting GC contact list export file...");

  let config = {
    method: "GET",
    responseType: "blob",
    url,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  try {
    const response = await axios(config);

    const contacts = await csvtojson({
      noheader: false,
      output: "json",
    }).fromString(response.data);
    debugGenesys(`GC getContactListFile returned ${contacts.length} contacts`);
    return res.status(200).send(contacts);
  } catch (error) {
    debugGenesys("Error getting GC contact list export file");
    debugGenesys(error.message);
    return res.status(400).send({ message: error.message });
  }
};

module.exports = {
  getContactLists,
  getContacts,
  addContacts,
  updateContact,
  getContactListUri,
  getContactListFile,
};
