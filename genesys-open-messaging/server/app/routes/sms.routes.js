const { sms_send } = require("../handlers/sms/sms_send");
const { sms_received } = require("../handlers/sms/sms_received");
const { sms_sent } = require("../handlers/sms/sms_sent");
const { sms_finalized } = require("../handlers/sms/sms_finalized");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post("/api/sms/send", (req, res) => {
    sms_send(req, res);
  });

  app.post("/api/sms/inbound", async (req, res) => {
    const { event_type } = req.body.data;

    if (event_type === "message.received") {
      sms_received(req);
    }
    if (event_type === "message.sent") {
      sms_sent(req);
    }
    if (event_type === "message.finalized") {
      sms_finalized(req);
    }
    return res.status(200).send({});
  });
};
