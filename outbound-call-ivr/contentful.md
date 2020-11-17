# Working with Answering Machine Detection (AMD)

Outbound calls placed with Call Control can be enabled with Answering Machine Detection (AMD, Voicemail Detection).

When a call is answered, Telnyx runs real-time detection to determine if it was picked up by a human or a machine and sends webhooks with the analysis result.

## AMD Settings

The `answering_machine_detection` value when creating an outbound call or transferring an inbound call can be set to one of the following:

| Setting        | Description                                                                                                                                                                                     | Webhooks Sent                                                                                                           |
|:---------------|:------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|:------------------------------------------------------------------------------------------------------------------------|
| `detect`       | _Only_ detect if answering machine or human.                                                                                                                                                    | `call.machine.detection.ended`                                                                                          |
| `detect_beep`  | Listens for a _final_ "beep" sound after detecting a `machine`                                                                                                                                  | `call.machine.detection.ended` and `call.machine.greeting.ended` **only** if a beep is detected                         |
| `detect_words` | **RECOMMENDED** After a `machine` is detected, a 30 second long beep detection will begin. Note the answering machine may still be playing it's greeting while the 30 seconds is counting down. | `call.machine.detection.ended` and `call.machine.greeting.ended` when the beep is detected or at the end of 30 seconds. |
| `greeting_end` | Listens for extended periods of silence or a beep in the greeting to determine if a greeting has ended.                                                                                         | `call.machine.detection.ended` and `call.machine.greeting.ended`                                                        |

### Sample Dial Request

```http
POST https://api.telnyx.com/v2/calls HTTP/1.1
Content-Type: application/json; charset=utf-8
Authorization: Bearer YOUR_API_KEY

{
  "connection_id" : "1494404757140276705",
  "to"            : "+19198675309",
  "from"          : "+19842550944",
  "webhook_url"   : "https://webhook_url.com/outbound_call_events",
  "answering_machine_detection" : "detect_words"
}
```

### General order of operations

1. Create outbound call.
2. Receive `call.initiated` webhook.
3. Receive `call.answered` webhook when the call is answered either by human or machine.
4. Receive `call.machine.detection.ended` webhook with human/machine status.
5. Receive `call.machine.greeting.ended` webhook when beep detected or 30 second timeout.

x. **Important** at any point, the callee could hangup generating a `call.hangup` webhook.

## `call.machine.detection.ended` Webhook

The `call.machine.detection.ended` is sent when Telnyx can make a determination on human or machine.

The `data.payload.result` will contain the information about the answering machine:

| Result     | Description                                  |
|:-----------|:---------------------------------------------|
| `human`    | Human answered call                          |
| `machine`  | Machine answered call                        |
| `not_sure` | _Recommended_ to treat as if human answered. |

### Sample Webhook

```json
{
  "data": {
    "event_type": "call.machine.detection.ended",
    "id": "0ccc7b54-4df3-4bca-a65a-3da1ecc777f0",
    "occurred_at": "2018-02-02T22:25:27.521992Z",
    "payload": {
      "call_control_id": "v2:T02llQxIyaRkhfRKxgAP8nY511EhFLizdvdUKJiSw8d6A9BborherQ",
      "call_leg_id": "428c31b6-7af4-4bcb-b7f5-5013ef9657c1",
      "call_session_id": "428c31b6-abf3-3bc1-b7f4-5013ef9657c1",
      "client_state": "aGF2ZSBhIG5pY2UgZGF5ID1d",
      "connection_id": "7267xxxxxxxxxxxxxx",
      "from": "+35319605860",
      "result": "machine",
      "to": "+13129457420"
    },
    "record_type": "event"
  }
}
```

## `call.machine.greeting.ended` Webhook

If the `answering_machine_detection` was set to `detect_beep`, `detect_words`, `greeting_end` you could receive a final webhook when the prompt (or beep detection) has finished.

The `data.payload.result` will contain the information about the answering machine:

| Result          | Description                                                        | AMD Setting                                  |
|:----------------|:-------------------------------------------------------------------|:---------------------------------------------|
| `ended`         | Greeting is over.                                                  | **ONLY** sent when setting is `greeting_end` |
| `beep_detected` | Beep has been detected                                             | `detect_beep` and `detect_words`             |
| `not_sure`      | 30 second beep detection timeout fired after detecting a `machine` | `detect_beep` and `detect_words`             |

### Sample Webhook

```json
{
  "data": {
    "event_type": "call.machine.greeting.ended",
    "id": "0ccc7b54-4df3-4bca-a65a-3da1ecc777f0",
    "occurred_at": "2018-02-02T22:25:27.521992Z",
    "payload": {
      "call_control_id": "v2:T02llQxIyaRkhfRKxgAP8nY511EhFLizdvdUKJiSw8d6A9BborherQ",
      "call_leg_id": "428c31b6-7af4-4bcb-b7f5-5013ef9657c1",
      "call_session_id": "428c31b6-abf3-3bc1-b7f4-5013ef9657c1",
      "client_state": "aGF2ZSBhIG5pY2UgZGF5ID1d",
      "connection_id": "7267xxxxxxxxxxxxxx",
      "from": "+35319605860",
      "result": "ended",
      "to": "+13129457420"
    },
    "record_type": "event"
  }
}
```
