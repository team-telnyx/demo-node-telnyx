import xmlFormat from "xml-formatter";

export const hangupTeXML = (hangupSentence: string) =>
  xmlFormat(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${hangupSentence}</Say>
  <Hangup/>
</Response>`);
