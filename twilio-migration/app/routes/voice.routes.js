module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post("/api/twilio/voice", (req, res) => {
    console.log("Received webhook:");
    console.log(req.body);
    res.status(200).send();
  });
};
