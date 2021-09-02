require('dotenv').config();
const telnyxApiKey = process.env.TELNYX_API_KEY;
const CONNECTION_ID = process.env.TELNYX_CONNECTION_ID;
const BILLING_GROUP_ID = process.env.TELNYX_BILLING_GROUP_ID;
const MESSAGING_PROFILE_ID = process.env.TELNYX_MESSAGING_PROFILE_ID;
const PENDING_STATUS= 'purchase-pending';

const telnyx = require('telnyx')(telnyxApiKey);
const prompts = require('prompts');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const validatePhoneForE164 = phoneNumber => (/^\+[1-9]\d{10,14}$/).test(phoneNumber);

const searchNumbers = async (numberType, areaCode, partialNumber) => {
  try {
    const filter = {
        features: ['sms'],
        country_code: 'US',
        exclude_held_numbers: true,
        limit: 10,
    }
    if (numberType === 'toll-free') {
      filter.number_type = numberType;
    }
    else {
      filter.national_destination_code = areaCode
    }
    if (typeof partialNumber !== 'undefined') {
      filter.phone_number = {contains: partialNumber};
    }
    console.log(filter);
    const availableNumbers = await telnyx.availablePhoneNumbers.list({filter});
    const phoneNumbers = availableNumbers.data.map(e => e.phone_number);
    return phoneNumbers;
  } catch (e) {
    console.log(`Error searching numbers`);
    console.log(e);
    console.log(e.raw.errors);
    process.exit(1)
  }
}

const orderNumber = async phoneNumber => {
  try {
    const orderPayload = {
      connection_id: CONNECTION_ID,
      messaging_profile_id: MESSAGING_PROFILE_ID,
      billing_group_id: BILLING_GROUP_ID,
      phone_numbers: [{
        phone_number: phoneNumber
      }]
    }
    console.log(orderPayload);
    const result = await telnyx.numberOrders.create(orderPayload);
    return result;
  } catch (e) {
    console.log(`Error ordering number: ${phoneNumber}`);
    console.log(e.raw.errors);
    process.exit(1)
  }
}

const printArray = array => {
  array.forEach(e => {
    console.log(`* ${e}`);
  })
}

const waitForOrderComplete = async (phoneNumber, attempts = 10) => {
  try {
    attempts = attempts - 1;
    const result = await telnyx.phoneNumbers.retrieve(phoneNumber);
    const orderStatus = result.data.status;
    if (orderStatus === PENDING_STATUS && attempts > 0) {
      await sleep(1000);
      return waitForOrderComplete(phoneNumber, attempts);
    }
    return result;
  } catch (e) {
    console.log(`Error checking status of orderId: ${phoneNumber}`);
    console.log(e);
  }
}

const promptNumberType = async () => {
  const tollFreeOrLocal = await prompts({
    type: 'text',
    name: 'numberType',
    message: 'toll-free or local search?',
    validate: numberType => (numberType === 'toll-free' || numberType === 'local')
  });
  return tollFreeOrLocal.numberType;
};

const promptAreaCode = async () => {
  const response = await prompts({
    type: 'text',
    name: 'areaCode',
    message: 'areaCode to search?',
    validate: areaCode => (areaCode.length === 3)
  });
  return response.areaCode;
};

const promptPartialSearch = async () => {
  const partialSearch = await prompts({
    type: 'confirm',
    name: 'value',
    message: `Would you like to perform a partial search?`,
    inital: false
  });
  return partialSearch.value;
};

const promptPartialNumber = async phoneNumberSearchResult => {
  printArray(phoneNumberSearchResult);
  const partialOrderResponse = await prompts({
    type: 'text',
    name: 'partialNumber',
    message: `What partial would you like to search?`
  });
  return partialOrderResponse.partialNumber;
};

const promptSelectNumber = async phoneNumberSearchResult => {
  const choices = phoneNumberSearchResult.map(e => { return {title: e, value: e} })
  const selectNumberResponse = await prompts({
    type: 'select',
    name: 'value',
    message: `Which number would you like to order?`,
    choices: choices,
    inital: 1
  });
  return selectNumberResponse.value;
};

const promptConfirmOrder = async phoneNumber => {
  const confirmOrderResponse = await prompts({
    type: 'confirm',
    name: 'value',
    message: `(y/n) Order number: ${phoneNumber}`,
    inital: true
  });
  return confirmOrderResponse.value;
};

const main = async () => {
  let areaCode = '919';
  const numberType = await promptNumberType();
  if (numberType === 'local') {
    areaCode = await promptAreaCode();
  }
  let phoneNumberSearchResult = await searchNumbers(numberType, areaCode);
  const searchPartial = await promptPartialSearch();
  if (searchPartial) {
    const partialNumber = await promptPartialNumber(phoneNumberSearchResult);
    phoneNumberSearchResult = await searchNumbers(numberType, areaCode, partialNumber);
  }
  if (phoneNumberSearchResult.length === 0) {
    console.log('No available numbers with that criteria');
    return;
  }
  const phoneNumber = await promptSelectNumber(phoneNumberSearchResult);
  const confirmOrderResponse = await promptConfirmOrder(phoneNumber);
  if (!confirmOrderResponse){
    console.log('Ok, not ordering thanks');
    return;
  }
  const orderResponse = await orderNumber(phoneNumber);
  const phoneNumberObject = await waitForOrderComplete(phoneNumber);
  console.log(phoneNumberObject);
}

main();