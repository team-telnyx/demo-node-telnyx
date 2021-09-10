const cron = require("node-cron");
const db = require('../models/db');

module.exports.playBeepOnLiveCalls = async () => {
    const liveCalls = db.getLiveCallIds();

}
