const {
  getAuthToken,
  authCode,
  checkAuthToken,
} = require("../handlers/genesys/auth");

module.exports = function (app) {
  app.use((req, res, next) => {
    res.header(
      "Access-Control-Allow-Headers",
      "Access-Control-Allow-Origin",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get("/api/genesys/code/get", async (req, res) => {
    await authCode(req, res);
  });

  app.post("/api/genesys/token/get", async (req, res) => {
    await getAuthToken(req, res);
  });

  app.get("/api/genesys/token/check", async (req, res) => {
    await checkAuthToken(req, res);
  });
};
