const express  = require('express');
const router = module.exports = express.Router();
const urljoin = require('url-join');
const phone = require('phone');

const telnyx = require('telnyx')(process.env.TELNYX_API_KEY);

const messageController = async (req, res) =>  {
  const media_url = req.body.media_url;
  const messageRequest = {
    to: phone(req.body.to)[0],
    from: phone(req.body.from)[0],
    text: req.body.text,
    webhook_url: urljoin(`${req.protocol}://${req.hostname}`, '/messaging/outbound')
  }
  if (media_url){
    messageRequest.media_urls = [media_url];
  }
  try{
    const messageResponse = await telnyx.messages.create(messageRequest);
    console.log(messageResponse);
    res.send(messageResponse);
  }
  catch (e) {
    console.log('error sending message');
    res.send(e);
  }
};

const inboundMessageController = (req, res) => {
  console.log(req.body);
  req.io.emit('messageCallback', req.body);
  res.sendStatus(200);
}

const outboundMessagingController = (req, res) => {
  console.log(req.body);
  req.io.emit('messageCallback', req.body);
  res.sendStatus(200);
}

router.route('/')
  .post(messageController)

router.route('/outbound')
  .post(outboundMessagingController)

router.route('/inbound')
  .post(inboundMessageController)
