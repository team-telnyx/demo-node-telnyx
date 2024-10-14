import xmlFormat from "xml-formatter";

/**
 * https://developers.telnyx.com/docs/voice/programmable-voice/texml-translator#gather
 */
export const gatherTeXML = (
  gatherPrompt: string,
  finishOnKey: string,
  minDigits: number,
  maxDigits: number
) =>
  xmlFormat(`<?xml version="1.0" encoding="UTF-8"?>
  <Response>
    <Gather action="gather" finishOnKey="${finishOnKey}" minDigits="${minDigits}" maxDigits="${maxDigits}">
      <Say voice="alice">${gatherPrompt}</Say>
    </Gather>
    <Say>Thank you for the call, hanging up</Say>
  </Response>`);

/**
 * https://developers.telnyx.com/docs/voice/programmable-voice/texml-translator#dial
 */
export const dialTeXML = (
  callerId: string,
  action: string,
  method: string,
  phoneNumber: string,
  record: string,
  recordingStatusCallback: string
) =>
  xmlFormat(`<?xml version="1.0" encoding="UTF-8"?>
  <Response>
    <Dial callerId="${callerId}"  action="${action}" method="${method}" record="${record}" recordingStatusCallback="${recordingStatusCallback}">
      <Number>${phoneNumber}</Number>
    </Dial>
  </Response>`);

/**
 * https://developers.telnyx.com/docs/voice/programmable-voice/texml-translator#hangup
 */
export const hangupTeXML = (hangupSentence: string) =>
  xmlFormat(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${hangupSentence}</Say>
  <Hangup/>
</Response>`);
