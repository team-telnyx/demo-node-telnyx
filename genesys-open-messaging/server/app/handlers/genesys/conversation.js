const axios = require("axios");
const debugGenesys = require("debug")("app:Genesys");
const platformClient = require("purecloud-platform-client-v2");

const getConversation = async (req, res) => {
  const { conversationId } = req.body;

  try {
    debugGenesys(`Getting conversation details for ID ${conversationId}`);

    const conversationsApiInstance = new platformClient.ConversationsApi();
    let opts = {
      id: [conversationId],
    };
    const conversation =
      await conversationsApiInstance.getAnalyticsConversationsDetails(opts);

    debugGenesys("Conversation details fetched");
    // debugGenesys(conversation);
    return res.status(200).send(conversation);
  } catch (error) {
    debugGenesys(`Error getting conversation details for ID ${conversationId}`);
    debugGenesys(error);
    return res.status(400).send({ message: error.message });
  }
};

const getActiveMessageConversation = async (req, res) => {
  const accessToken = req.headers.authorization.split(" ")[1];

  debugGenesys(`Getting user's active message conversations`);

  try {
    const response = await axios({
      url: `https://api.${process.env.GC_ENVIRONMENT}/api/v2/conversations/messages`,
      method: "get",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const user = response.data;
    debugGenesys("Active message conversation:");
    debugGenesys(response.data);
    return res.status(200).send(user);
  } catch (err) {
    debugGenesys("Error getting user's active message conversations");
    debugGenesys(err.message);
    return res.status(400).send({ message: err.message });
  }
};

module.exports = {
  getConversation,
  getActiveMessageConversation,
};
