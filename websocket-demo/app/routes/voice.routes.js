const controller = require("../controllers/voice.controller");

module.exports = function (app) {
  app.post("/api/voice/inbound", controller.receiveCall);
};
