const {
  receiveOpenMessage,
  sendOpenMessage,
  sendAgentlessMessage,
} = require("../handlers/genesys/openmessaging");

module.exports = function (app) {
  app.post("/api/genesys/sms/outbound", async (req, res) => {
    res.status(200).end();
    await receiveOpenMessage(req, res);
  });

  app.post("/api/genesys/sms/inbound", async (req, res) => {
    res.status(200).end();
    await sendOpenMessage(req);
  });

  app.post("/api/genesys/sms/agentless", async (req, res) => {
    res.status(200).end();
    await sendAgentlessMessage(req);
  });
};
