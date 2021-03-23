const database = require("./database.json")

module.exports.lookupUserByPhoneNumber = phoneNumber => database.filter(row => row.phoneNumber === phoneNumber)
      .reduce((result, row) => result = row, {});
