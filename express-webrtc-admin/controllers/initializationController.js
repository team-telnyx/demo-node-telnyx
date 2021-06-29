const express  = require('express');
const router = module.exports = express.Router();
const db = require('../models/db');
const telnyx = require('telnyx')(process.env.TELNYX_API_KEY);
const urljoin = require('url-join');
const texml = require('../packages/texml');

const setMessagingCallbackUrl = async (messagingProfileId, url) => {
  try {
    const { data: messagingProfiles } = await telnyx.messagingProfiles.retrieve(messagingProfileId);
    // messagingProfiles.id = messagingProfileId;
    const result = await messagingProfiles.update(messagingProfileId, {
      "webhook_url": url
    });
    return {
      ok: true,
      ...result
    }
  }
  catch (error) {
    console.log('Error setting messaging callback url');
    console.log(error);
    return {
      ok: false,
      error
    }
  }
}

const setTexmlConnectionCallbackUrl = async (connectionId, url) => {
  const data = {
    voice_url: url
  };
  const texmlProfileResult = await texml.updateTexmlApplication(connectionId, data);
  return texmlProfileResult;
}

const createInitialization = async (req, res) => {
  const baseUrl = `${req.protocol}://${req.hostname}`;
  const messagingCallbackUrl = urljoin(baseUrl, '/messaging/inbound');
  const messagingProfileId = process.env.TELNYX_MESSAGING_PROFILE_ID;
  const texmlConnectionId = process.env.TELNYX_CONNECTION_ID;
  const texmlCallbackUrl = urljoin(baseUrl, '/texml/inbound');
  const [messagingProfileResult, texmlProfileResult] = await Promise.allSettled([
      setMessagingCallbackUrl(messagingProfileId, messagingCallbackUrl),
      setTexmlConnectionCallbackUrl(texmlConnectionId, texmlCallbackUrl)
  ]);
  (messagingProfileResult.value.ok && texmlProfileResult.value.ok) ?
      res.status(200) :
      res.status(400);
  res.send({messagingProfile: messagingProfileResult.value, texmlProfile: texmlProfileResult.value})

}

router.route('/')
  .post(createInitialization);
