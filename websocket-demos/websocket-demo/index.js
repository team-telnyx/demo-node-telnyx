const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config();
const chalk = require("chalk");
const { logOutput } = require("./app/telnyx/chalk");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

require("./app/routes/voice.routes")(app);
require("./app/routes/websocket.routes")(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logOutput(`\nWWW server is running on port ${PORT}\n\n`, "#00FFFF");
});
