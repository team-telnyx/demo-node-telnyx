const { lookup } = require("../handlers/numberlookup/lookup");

module.exports = (app) => {
  app.use((req, res, next) => {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post("/api/nl", (req, res) => {
    lookup(req, res);
  });
};
