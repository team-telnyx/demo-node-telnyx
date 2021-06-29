const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    sessions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session'
    }]
});

module.exports = mongoose.model('CallGroup', schema);
