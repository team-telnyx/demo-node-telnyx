const fs = require('fs');
const path = require('path');
const phoneNumberTable = require("./phoneNumberTable.json");
const proxyNumberTable = require("./proxyNumberTable.json");
const liveCallsTable = require("./liveCallsTable.json");

module.exports.lookupUserByPSTNPhoneNumber = phoneNumber => phoneNumberTable.filter(row => row.pstnPhoneNumber === phoneNumber)
  .reduce((result, row) => result = row, {});

module.exports.saveTemporaryProxyNumber = (dialedPhoneNumber, pstnPhoneNumber, proxyPhoneNumber) => {
  proxyNumberTable.push({
    dialedPhoneNumber,
    pstnPhoneNumber,
    proxyPhoneNumber
  });
}

module.exports.lookupProxyByPSTNPhoneNumber = phoneNumber => proxyNumberTable.filter(row => row.pstnPhoneNumber)
  .reduce((result, row) => result = row, {});

module.exports.getLiveCallIds = () => liveCallsTable.filter(row => row.isLive)
    .map(row => row.CallSid);

module.exports.saveLiveCall = callRecord => liveCallsTable.push(callRecord);

module.exports.updateCallEnded = CallSid => {
  const foundIndex = liveCallsTable.findIndex(row => row.CallSid === CallSid);
  const record = liveCallsTable[foundIndex];
  record.isLive = false;
  record.EndTime = new Date().getTime();
  liveCallsTable[foundIndex] = record;
}
