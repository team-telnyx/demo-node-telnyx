const { campaignStart } = require("../handlers/genesys/campaign");

module.exports = function (app) {
  app.use((req, res, next) => {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post("/api/genesys/campaign/start", async (req, res) => {
    await campaignStart(req, res);
  });
};
