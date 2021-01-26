const express = require('express');
const telnyx = require('telnyx')(process.env.TELNYX_API_KEY);
const router = module.exports = express.Router();
const db = require('./db');
const CONNECTION_ID = process.env.TELNYX_CONNECTION_ID;

const searchNumbers = async (req, res, next) => {
  if (!req.body.areaCode || !req.body.destinationPhoneNumber
      || req.body.areaCode.length !== 3) {
    res.send({
      message: 'Invalid search criteria, please send 3 digit areaCode',
      example: '{ "areaCode": "919", "destinationPhoneNumber": "+19198675309" }'
    });
    return;
  }
  try {
    const areaCode = req.body.areaCode;
    const availableNumbers = await telnyx.availablePhoneNumbers.list({
      filter: {
        national_destination_code: areaCode,
        features: ["sms", "voice", "mms"],
        limit: 1
      }
    });
    const phoneNumber = availableNumbers.data.reduce((a, e) => e.phone_number,
        '');
    if (!phoneNumber) {
      res.send({message: 'No available phone numbers'}).status(200);
    } else {
      res.locals.phoneNumber = phoneNumber;
      next();
    }
  } catch (e) {
    const message = ''
    console.log(message);
    console.log(e);
    res.send({message}, ...e).status(400);
  }
}

const orderNumber = async (req, res, next) => {
  try {
    const phoneNumber = res.locals.phoneNumber;
    const result = await telnyx.numberOrders.create({
      connection_id: CONNECTION_ID,
      phone_numbers: [{
        phone_number: phoneNumber
      }]
    });
    res.locals.phoneNumberOrder = result.data;
    res.send(result.data);
    next();
  } catch (e) {
    const message = `Error ordering number: ${res.locals.phoneNumber}`
    console.log(message);
    console.log(e);
    res.send({message}, ...e).status(400);
  }
}

const saveBinding = async (req, res) => {
  try {
    db.addPhoneNumberBinding(res.locals.phoneNumber,
        req.body.destinationPhoneNumber)
  } catch (e) {
    res.send(e).status(409);
  }
}

const getBindings = async (req, res) => {
  if (req.query.telnyxPhoneNumber) {
    const telnyxPhoneNumber = req.query.telnyxPhoneNumber;
    const binding = db.getBinding(telnyxPhoneNumber);
    res.send(binding).status(200);
  } else {
    res.send(db.bindings);
  }
}

router.route('/')
.post(searchNumbers, orderNumber, saveBinding)
.get(getBindings)
