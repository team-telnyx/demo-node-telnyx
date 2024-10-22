import xmlFormat from "xml-formatter";

export const gatherTeXML = (gatherPrompt: string) =>
  xmlFormat(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather action="/gather" numDigits="1">
        <Say voice="alice">${gatherPrompt}</Say>
    </Gather>
   <Say>We did not receive any input. Goodbye!</Say>
</Response>`);

export const recordTeXML = (url: string) =>
  xmlFormat(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${url}</Play>
  <Record action="/recordFinished" recordingStatusCallback="recordStatus" playBeep=true/>
</Response>`);

export const hangupTeXML = (hangupSentence: string) =>
  xmlFormat(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${hangupSentence}</Say>
  <Hangup/>
</Response>`);

export const transferTeXML = (
  greeting: string,
  sip: string[],
  pstn: string[]
) => {
  const sipTexmlList =
      sip.length > 0
        ? sip.reduce(
            (sipList, sipDestination) =>
              `${sipList}<Sip>sip:${sipDestination}</Sip>`,
            ""
          )
        : "",
    pstnTexmlList =
      pstn.length > 0
        ? pstn.reduce(
            (pstnList, pstnDestination) =>
              `${pstnList}<Number>${pstnDestination}</Number>`,
            ""
          )
        : "";
  return xmlFormat(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${greeting}</Say>
  <Dial action="/dialFinished">${sipTexmlList}${pstnTexmlList}</Dial>
  <Hangup/>
</Response>`);
};
