const xmlFormat = require('xml-formatter');

module.exports.gatherTeXML = gatherPrompt => xmlFormat(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather action="gather" numDigits="1">
        <Say voice="alice">${gatherPrompt}</Say>
    </Gather>
   <Say>We did not receive any input. Goodbye!</Say>
</Response>`);

module.exports.recordTeXML = url => xmlFormat(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${url}</Play>
  <Record action="recordFinished" recordingStatusCallback="recordStatus" playBeep=true/>
</Response>`);

module.exports.hangupTeXML = hangupSentence => xmlFormat(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${hangupSentence}</Say>
  <Hangup/>
</Response>`);

module.exports.transferTeXML = (greeting, sip, pstn) => {
  const sipTexmlList = sip.length > 0 ? sip.reduce((sipList, sipDestination) => `${sipList}<Sip>sip:${sipDestination}</Sip>`, '') : '',
      pstnTexmlList = pstn.length > 0 ? pstn.reduce((pstnList, pstnDestination) => `${pstnList}<Number>${pstnDestination}</Number>`, '') : '';
  return xmlFormat(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${greeting}</Say>
  <Dial action="dialFinished">${sipTexmlList}${pstnTexmlList}</Dial>
  <Hangup/>
</Response>`);
};
