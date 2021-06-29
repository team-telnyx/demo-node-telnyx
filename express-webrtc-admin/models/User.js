const mongoose = require('mongoose');
const validatePhoneForE164 = require('../packages/utils').validatePhoneForE164;
const Schema = mongoose.Schema;

const schema = new Schema({
    telnyxNumber: {
        type: String,
        validate: {
            validator: validatePhoneForE164,
            message: props => `${props.value} is not a valid phone number`
        },
        required: false
    },
    telnyxTelephonyId: {type: String, required: false},
    telnyxTelephonyUserId: {type: String, required: false},
    telnyxTelephonyPassword: {type: String, required: false},
    telnyxTelephonySipUri: {type: String, required: false},
    email: {type: String, required: true},
    online: {type: Boolean, required: false, default: false},
    active: {type: Boolean, required: false, default: false},
});

module.exports = mongoose.model('User', schema);
