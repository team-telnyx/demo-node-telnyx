const express  = require('express');
const router = module.exports = express.Router();
const db = require('../models/db');
const texml = require('../packages/texml');

const deleteConference = async (req, res) => {
  const [conferenceId, organizationId] = await Promise.allSettled([
      db.getValueByKey('conferenceId'),
      db.getValueByKey('organizationId')
  ]);
  if (!conferenceId.value.ok) {
    res.send({message: 'Conference Id not found in db'});
    return;
  }
  if (!organizationId.value.ok) {
    res.status(400).send({message: 'Can not find organizationId in db'});
    return;
  }
  const dbResult = await db.deleteValueByKey('conferenceId');
  const endConferenceResult = await texml.endConference(conferenceId.value.value, organizationId.value.value)
  endConferenceResult.ok ? res.status(200) : res.status(400);
  res.send(endConferenceResult);
}


router.route('/')
  .delete(deleteConference);
