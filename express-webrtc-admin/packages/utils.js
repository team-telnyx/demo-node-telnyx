
module.exports.toBase64 = data => (new Buffer.from(data)).toString('base64');
module.exports.fromBase64 = data => (new Buffer.from(data, 'base64')).toString();
module.exports.errorLogger = (functionName, error) => {
    console.error(`Error in: ${functionName}`, error);
    return {
        ok: false,
        error,
    }
}

module.exports.validatePhoneForE164 = phoneNumber => /^\+[1-9]\d{10,14}$/.test(phoneNumber);
