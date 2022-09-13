const controller = require("../controllers/websocket.controller");
const enableWs = require("express-ws");

module.exports = (app) => {
  enableWs(app);
  app.ws("/microsoft", controller.answerWSMicrosoft);
  app.ws("/amazon", controller.answerWSAmazon);
  app.ws("/google", controller.answerWSGoogle);
};
