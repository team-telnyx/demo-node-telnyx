const phoneNumberTable = require("./phoneNumberTable.json");

module.exports.lookupUserByPSTNPhoneNumber = phoneNumber => phoneNumberTable.filter(row => row.pstnPhoneNumber === phoneNumber)
  .reduce((result, row) => result = row, {});

