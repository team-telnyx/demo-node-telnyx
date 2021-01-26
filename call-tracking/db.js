const bindings = [
    {
        "telnyxPhoneNumber": "+19194598952",
        "destinationPhoneNumber": "+19197891146",
        "calls": [
            {
                "event_type": "call.hangup",
                "id": "7ce0a8df-8a76-4a3f-8670-f56a1d168a3f",
                "occurred_at": "2021-01-26T04:20:59.889359Z",
                "payload": {
                    "call_control_id": "v2:rH1eWumVAJBxUvrd5pjRff2TkjncFS4fEF9of7u4Bje2IvytNAOJ8Q",
                    "call_leg_id": "de970942-5f8d-11eb-8ad2-02420a0f7668",
                    "call_session_id": "de971acc-5f8d-11eb-b56a-02420a0f7668",
                    "client_state": null,
                    "connection_id": "1557657082730120568",
                    "end_time": "2021-01-26T04:20:59.889359Z",
                    "from": "+14154886792",
                    "hangup_cause": "normal_clearing",
                    "hangup_source": "callee",
                    "sip_hangup_cause": "200",
                    "start_time": "2021-01-26T04:20:49.409357Z",
                    "to": "+19194598952"
                },
                "record_type": "event"
            }
        ]
    },
    {
        "telnyxPhoneNumber": "+19193233616",
        "destinationPhoneNumber": "+19197891146",
        "calls": []
    }
];
module.exports.bindings = bindings;

module.exports.addPhoneNumberBinding = (telnyxPhoneNumber, destinationPhoneNumber) => {
  const index = bindings.findIndex(binding => binding.telnyxPhoneNumber === telnyxPhoneNumber);
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
  return { ok: true }
};

module.exports.getDestinationPhoneNumber = telnyxPhoneNumber => {
  const destinationPhoneNumber = bindings
    .filter(binding => binding.telnyxPhoneNumber === telnyxPhoneNumber)
    .reduce((a, binding) => binding.destinationPhoneNumber, '');
  return destinationPhoneNumber;
};

module.exports.saveCall = callWebhook => {
  const telnyxPhoneNumber = callWebhook.payload.to;
  const index = bindings.findIndex(binding => binding.telnyxPhoneNumber === telnyxPhoneNumber);
  bindings[index].calls.push(callWebhook);
};

module.exports.getBinding = telnyxPhoneNumber => {
  return bindings.filter(binding => binding.telnyxPhoneNumber === telnyxPhoneNumber);
};
