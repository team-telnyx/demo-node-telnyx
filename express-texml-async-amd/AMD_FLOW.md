# Premium AMD with TeXML Call Update Flow

## Overview

This implementation uses **asynchronous premium AMD** with **TeXML Call Update API** to deliver different messages based on whether a human or machine answers the call.

## How It Works

### Step 1: Initiate Call with Async AMD
**dialer.js** initiates the outbound call with these key parameters:

```javascript
{
  MachineDetection: 'DetectMessageEnd',
  DetectionMode: 'Premium',
  AsyncAmd: true,  // AMD runs in background
  AsyncAmdStatusCallback: 'https://cpass.telnyx.solutions:3000/texml/status',
  StatusCallbackEvent: ['initiated', 'answered', 'amd', 'completed']
}
```

### Step 2: Initial TeXML Response
When the call is answered, Telnyx requests TeXML from `/texml` endpoint.

**server.js** returns a simple response that plays silence while AMD processes:

```xml
<Response>
  <Pause length="30"/>
</Response>
```

This keeps the call active while AMD detection happens in the background.

### Step 3: AMD Detection Complete
Telnyx performs premium AMD analysis and sends a callback to `/texml/status` with:

```json
{
  "event_type": "amd_premium_greeting_ended",
  "payload": {
    "CallSid": "v3:...",
    "AnsweredBy": "human" | "machine_end_beep" | "machine_end_other" | "unknown",
    "From": "+14162739775",
    "To": "+14168305230"
  }
}
```

### Step 4: Update Call with Inline TeXML
When the AMD callback is received, **server.js**:

1. Extracts the `AnsweredBy` result
2. Generates appropriate TeXML based on the result
3. Calls the **TeXML Update Call API** with inline XML:

```javascript
POST https://api.telnyx.com/v2/texml/Accounts/{account_sid}/Calls/{call_sid}
{
  "Texml": "<Response><Say voice='alice'>Hello! This is a call...</Say><Hangup/></Response>"
}
```

### Step 5: Message Delivered Immediately
Telnyx receives the inline TeXML and immediately plays the appropriate message:

**For Human:**
```xml
<Response>
  <Say voice="alice">
    Hello! This is a call from Acme Corporation...
  </Say>
  <Hangup/>
</Response>
```

**For Voicemail:**
```xml
<Response>
  <Pause length="1"/>
  <Say voice="alice">
    Hi, this is a message from Acme Corporation.
    Please call us back at 1-800-555-0123...
  </Say>
  <Hangup/>
</Response>
```

## Call Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Dialer initiates call with AsyncAmd=true                │
│    POST /v2/texml/Accounts/{sid}/Calls                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Call answered - Telnyx requests initial TeXML           │
│    GET /texml                                               │
│    Returns: <Response><Pause length="30"/></Response>      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. AMD runs in background (Premium detection)              │
│    Analyzing greeting, detecting human vs machine...       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. AMD complete - Callback received                        │
│    POST /texml/status                                       │
│    Event: amd_premium_greeting_ended                        │
│    AnsweredBy: "human" or "machine_end_beep"                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Update call with inline TeXML                           │
│    POST /v2/texml/Accounts/{sid}/Calls/{call_sid}         │
│    Body: { "Texml": "<Response>...</Response>" }          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Message played immediately and call ends                │
└─────────────────────────────────────────────────────────────┘
```

## Endpoints

### `/texml` (GET/POST)
- **Purpose**: Initial TeXML request when call is answered
- **Returns**: Simple pause to keep call active while AMD processes
- **Called by**: Telnyx when call connects

### `/texml/status` (POST)
- **Purpose**: Receives status callbacks including AMD events
- **Detects**: Callbacks with `AnsweredBy` field (AMD result)
- **Action**: Generates appropriate TeXML and updates call with inline XML using `Texml` parameter
- **Called by**: Telnyx for each status event (especially AMD callbacks)

## AMD Detection Values

The `AnsweredBy` parameter can be:

- **`human`** or **`human_residence`** → Live person answered
- **`machine_end_beep`** → Voicemail with beep detected
- **`machine_end_other`** → Voicemail without beep
- **`fax`** → Fax machine detected (hang up)
- **`unknown`** → Could not determine (treat as human)

## Key Configuration

### Async AMD (Required)
```javascript
AsyncAmd: true
```
Enables background AMD processing so the call can start while detection happens.

### Premium Detection (Required)
```javascript
DetectionMode: 'Premium'
```
Uses advanced ML models for better accuracy ($0.005 per call).

### Status Callback Events (Required)
```javascript
StatusCallbackEvent: ['initiated', 'answered', 'amd', 'completed']
```
Ensures we receive the AMD event notification.

## Advantages of This Approach

✅ **No delay for humans** - Call connects immediately, message plays as soon as AMD completes
✅ **Accurate detection** - Premium AMD provides better human/machine classification
✅ **Flexible messaging** - Can play completely different messages based on result
✅ **Handles edge cases** - Unknown results treated as human to avoid missed connections
✅ **Inline TeXML** - No additional HTTP request needed, faster message delivery
✅ **Simpler architecture** - Fewer endpoints, direct XML injection into active call

## Testing

1. Start the server:
   ```bash
   npm start
   ```

2. Run the dialer:
   ```bash
   npm run dial
   ```

3. Monitor the logs for:
   - Initial TeXML request
   - Status callback with AMD result
   - Call update API call
   - Final AMD TeXML request

## Troubleshooting

### Call disconnects before message plays
- Check that initial `<Pause length="30"/>` is long enough
- Verify AMD completes within 5 seconds (typical)

### Not receiving AMD callbacks
- Verify `AsyncAmdStatusCallback` URL is correct
- Check `StatusCallbackEvent` includes `'amd'`
- Review Telnyx webhook logs in Mission Control Portal

### Call update fails
- Verify `TELNYX_ACCOUNT_SID` is correct
- Check API key has permissions for call updates
- Ensure `CallSid` from callback is valid

## References

- [TeXML Update Call API](https://developers.telnyx.com/api/call-scripting/update-texml-call)
- [TeXML AMD Documentation](https://developers.telnyx.com/docs/voice/programmable-voice/texml-answering-machine)
- [TeXML Instruction Fetching](https://developers.telnyx.com/docs/voice/programmable-voice/texml-instruction-fetching)
