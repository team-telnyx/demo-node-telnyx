const db = [];

const addCallTrackingNumber = (telnyxNumber, destinationNumber) =>  db.push({telnyxNumber, destinationNumber})

const getDestinationNumberFromTelnyxNumber = telnyxNumber => (db.filter(entry => entry.telnyxNumber === telnyxNumber).map(entry => entry.destinationNumber)).pop()

