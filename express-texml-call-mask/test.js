const XMLformat = require('xml-formatter');

const transferTexml = (greeting, sipDestinations, pstnDestinations) => {
  const sipTexmlList = sipDestinations.length > 0 ? sipDestinations.reduce((sipList, sipDestination) => `${sipList}<Sip>${sipDestination}</Sip>`, '') : '';
  console.log(sipTexmlList);
  const pstnTexmlList = pstnDestinations.length > 0 ? pstnDestinations.reduce((pstnList, pstnDestination) => `${pstnList}<Number>${pstnDestination}</Number>`, '') : ''
  console.log(pstnTexmlList)
  return XMLformat(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${greeting}</Say>
  <Dial>${sipTexmlList}${pstnTexmlList}</Dial>
  <Hangup/>
</Response>`);
}


// console.log(transferTexml("Connecting your call", ["SIP:test@123.com", "SIP:dant@123.com"], ["+19197891146"]));


const database = [
  {
    "phoneNumber": "+19197891146",
    "sip": [
      "SIP:dant31760@sip.telnyx.com",
      "SIP:happy@sip.telnyx.com"
    ],
    "pstn": [
      "+19198675309"
    ]
  }
]


// const lookupByPhoneNumber = phoneNumber => {
//   return database
//       .filter(row => row.phoneNumber === phoneNumber)
//       .reduce((destinations, row) => {
//         destinations.sip = row.sip;
//         destinations.pstn = row.pstn;
//         return destinations;
//       }, {});
// }

const lookupByPhoneNumber = phoneNumber => database.filter(row => row.phoneNumber === phoneNumber)
      .reduce((destinations, row) => destinations = row, {});


console.log(lookupByPhoneNumber("+19197891146"));
