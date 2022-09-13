const Voice = require("../telnyx/voice");

exports.receiveCall = (req, res) => {
  Voice.receiveCall(req.body, (response) => {
    res.status(200).send(response);
  });
};
