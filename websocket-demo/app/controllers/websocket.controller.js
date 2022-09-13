const WSMicrosoft = require("../microsoft/websocket");
const WSAmazon = require("../amazon/websocket");
const WSGoogle = require("../google/websocket");

exports.answerWSMicrosoft = (ws, req) => {
  WSMicrosoft.answerWSMicrosoft(ws, req, (response) => {
    res.status(200).send(response);
  });
};

exports.answerWSAmazon = (ws, req) => {
  WSAmazon.answerWSAmazon(ws, req, (response) => {
    res.status(200).send(response);
  });
};

exports.answerWSGoogle = (ws, req) => {
  WSGoogle.answerWSGoogle(ws, req, (response) => {
    res.status(200).send(response);
  });
};
