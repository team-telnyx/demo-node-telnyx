const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config();
const { make_call } = require("./app/handlers/make_call");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

require("./app/routes/voice.routes")(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {});

make_call();
