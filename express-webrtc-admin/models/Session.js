const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const validatePhoneForE164 = require('../packages/utils').validatePhoneForE164;

const schema = new Schema({
    inboundCallerPhoneNumber: {
        type: String,
        validate: {
            validator: validatePhoneForE164,
            message: props => `${props.value} is not a valid phone number`
        },
        required: false
    },
    telnyxPhoneNumber: {
        type: String,
        validate: {
            validator: validatePhoneForE164,
            message: props => `${props.value} is not a valid phone number`
        },
        required: false
    },
    inboundCallControl: {
        callControlId: {type: String, required: true},
        callSessionId: {type: String, required: true},
        callLegId: {type: String, required: true},
    },
    callStartTime: {type: Date, default: Date.now, required: false },
    callAnswerTime: {type: Date, default: Date.now, required: false },
    callFinishTime: {type: Date, default: Date.now, required: false },
    outboundCallControlLegs: [{
        callControlId: {type: String, required: true},
        callSessionId: {type: String, required: true},
        callLegId: {type: String, required: true},
        finalStatus: {type: String, request: false},
        callStartTime: {type: Date, default: Date.now, required: false },
        callEndTime:  {type: Date, default: Date.now, required: false },
        sipUri: {type: String, required: true},
    }],
});

module.exports = mongoose.model('Session', schema);
