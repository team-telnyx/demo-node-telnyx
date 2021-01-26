const bindings = [];
module.exports.bindings = bindings

module.exports.addPhoneNumberBinding = (telnyxPhoneNumber,
    destinationPhoneNumber) => {
  const index = bindings.findIndex(
      binding => binding.telnyxPhoneNumber === telnyxPhoneNumber);
  if (index > 0) {
    return {
      ok: false,
      message: `Binding of Telnyx: ${telnyxPhoneNumber} already exists`,
      binding: bindings[index]
    }
  }
  const binding = {
    telnyxPhoneNumber,
    destinationPhoneNumber,
    calls: []
  }
  bindings.push(binding);
  return {
    ok: true
  }
}

module.exports.getDestinationPhoneNumber = telnyxPhoneNumber => {
  const destinationPhoneNumber = bindings
    .filter(binding => binding.telnyxPhoneNumber === telnyxPhoneNumber)
    .reduce((a, binding) => binding.destinationPhoneNumber, '');
  return destinationPhoneNumber;
}

module.exports.saveCall = callWebhook => {
  const telnyxPhoneNumber = callWebhook.payload.to;
  const index = bindings.findIndex(
      binding => binding.telnyxPhoneNumber === telnyxPhoneNumber);
  bindings[index].calls.push(callWebhook);
}

module.exports.getBinding = telnyxPhoneNumber => {
  return bindings.filter(
      binding => binding.telnyxPhoneNumber === telnyxPhoneNumber);
}
