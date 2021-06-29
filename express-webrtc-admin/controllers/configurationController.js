const express  = require('express');
const router = module.exports = express.Router();
const db = require('../models/db');

const saveConfiguration = async (req, res) => {
  const key = req.params.key;
  const value = req.body.value;
  const dbResult = await db.saveValueByKey(key, value);
  dbResult.ok ? res.status(200) : res.status(400);
  res.send(dbResult);
}

const fetchConfiguration = async (req, res) => {
  const key = req.params.key;
  const dbResult = await db.getValueByKey(key);
  dbResult.ok ? res.status(200) : res.status(400);
  res.send(dbResult);
}

const deleteConfiguration = async (req, res) => {
  const key = req.params.key;
  const dbResult = await db.deleteValueByKey(key);
  dbResult.ok ? res.status(200) : res.status(400);
  res.send(dbResult);
}

router.route('/:key')
  .put(saveConfiguration)
  .get(fetchConfiguration)
  .delete(deleteConfiguration);
