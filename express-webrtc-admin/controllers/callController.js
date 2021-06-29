const express  = require('express');
const router = module.exports = express.Router();
const texml = require('../packages/texml');
const urljoin = require('url-join');
const phone = require('phone');

const handleCallRequest = async (req, res) => {
  console.log(req.body);
  const callRequest = {
    To: req.body.sipURI,
    From: phone(req.body.to)[0],
    Url: encodeURI(urljoin(`${req.protocol}://${req.hostname}`,
                           `texml/webrtc-answser`,
                           `?to=${req.body.to}`,
                           `&from=${req.body.from}`))
  }
  const callResult = await texml.createTexmlCall(callRequest);
  (callResult.ok) ? res.status(200) : res.status(400);
  res.send({callResult});
}

router.route('/')
  .post(handleCallRequest);
