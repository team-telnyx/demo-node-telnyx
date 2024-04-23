const express = require("express");
// const { query, validationResult } = require("express-validator");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const debugGenesys = require("debug")("app:Genesys");
const debugWWW = require("debug")("app:WWW");
require("dotenv").config();
const app = express();
const {
  getClientGrant,
  authValidation,
} = require("./app/handlers/genesys/auth");

const whitelist = process.env.WHITELISTED_DOMAINS
  ? process.env.WHITELISTED_DOMAINS.split(",")
  : [];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log("Domain not allowed by CORS:", origin);
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
// app.use(authValidation);

sessionMap = {};

require("./app/routes/auth.routes")(app);
require("./app/routes/openmessaging.routes")(app);
require("./app/routes/campaign.routes")(app);
require("./app/routes/numberlookup.routes")(app);
require("./app/routes/sms.routes")(app);

app.locals.accessToken = "";

debugWWW(`NODE ENVIRONMENT: ${process.env.NODE_ENV}`);
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  debugWWW(`WWW server is running on port ${PORT}`);
  debugWWW("Whitelisted domains:", whitelist);

  setInterval(async () => {
    debugGenesys("Refreshing Genesys Cloud client grant...");
    const accessToken = await getClientGrant();
    app.locals.accessToken = accessToken;
  }, 12 * 60 * 60 * 1000);
  debugGenesys("Generating Genesys Cloud client grant...");
  const accessToken = await getClientGrant();
  app.locals.accessToken = accessToken;
});
