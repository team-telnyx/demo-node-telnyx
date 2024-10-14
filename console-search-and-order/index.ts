import "dotenv/config";
import Telnyx from "telnyx";
import prompts from "prompts";

const telnyxApiKey = process.env.TELNYX_API_KEY;
const CONNECTION_ID = process.env.TELNYX_CONNECTION_ID;
const BILLING_GROUP_ID = process.env.TELNYX_BILLING_GROUP_ID;
const MESSAGING_PROFILE_ID = process.env.TELNYX_MESSAGING_PROFILE_ID;

const telnyx = new Telnyx(telnyxApiKey || "");

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const printArray = (array: unknown[]) =>
  array.forEach((e) => console.log(`* ${e}`));

const searchNumbers = async (
  numberType: string,
  areaCode: string,
  partialNumber?: string
) => {
  try {
    const params: Telnyx.AvailablePhoneNumbersListParams = {
      "filter[features]": ["sms"],
      "filter[country_code]": "US",
      "filter[exclude_held_numbers]": true,
      "filter[limit]": 10,
    };
    if (numberType === "toll_free") {
      params["filter[phone_number_type]"] = numberType;
    } else {
      params["filter[national_destination_code]"] = areaCode;
    }
    if (typeof partialNumber !== "undefined") {
      params["filter[phone_number][contains]"] = partialNumber;
    }
    console.log(params);
    const availableNumbers = await telnyx.availablePhoneNumbers.list(params);
    const phoneNumbers = availableNumbers.data?.map((e) => e.phone_number!);
    return phoneNumbers;
  } catch (e) {
    console.log(`Error searching numbers`);
    console.log((e as { raw: Telnyx.TelnyxRawError }).raw.errors);
    process.exit(1);
  }
};

const orderNumber = async (phoneNumber: string) => {
  try {
    const orderPayload = {
      connection_id: CONNECTION_ID,
      messaging_profile_id: MESSAGING_PROFILE_ID,
      billing_group_id: BILLING_GROUP_ID,
      phone_numbers: [
        {
          phone_number: phoneNumber,
        },
      ],
    };
    console.log(orderPayload);
    const result = await telnyx.numberOrders.create(orderPayload);
    return result;
  } catch (e: unknown) {
    console.log(`Error ordering number: ${phoneNumber}`);
    console.log((e as { raw: Telnyx.TelnyxRawError }).raw.errors);
    process.exit(1);
  }
};

const waitForOrderComplete = async (phoneNumber: string, attempts = 10) => {
  try {
    attempts = attempts - 1;
    console.log(`Checking order status, ${attempts} attempts left`);
    const result = await telnyx.phoneNumbers.retrieve(phoneNumber);
    const orderStatus = result.data?.status;
    if (orderStatus === "purchase-pending" && attempts > 0) {
      await sleep(1000);
      return waitForOrderComplete(phoneNumber, attempts);
    }
    return result;
  } catch (e) {
    console.log(`Error checking status of orderId: ${phoneNumber}`);
    console.log(e);
  }
};

const updatePhoneNumber = async (
  phoneNumberId: string,
  updatePayload: Telnyx.PhoneNumbersUpdateParams
) => {
  try {
    const result = await telnyx.phoneNumbers.update(
      phoneNumberId,
      updatePayload
    );
    return result;
  } catch (e) {
    console.log(`Error updating phone number: ${phoneNumberId}`);
    console.log(e);
  }
};

const promptNumberType = async () => {
  const tollFreeOrLocal = await prompts({
    type: "text",
    name: "numberType",
    message: "toll_free or local search?",
    validate: (numberType) =>
      numberType === "toll_free" || numberType === "local",
  });
  return tollFreeOrLocal.numberType as string;
};

const promptAreaCode = async () => {
  const response = await prompts({
    type: "text",
    name: "areaCode",
    message: "areaCode to search?",
    validate: (areaCode) => areaCode.length === 3,
  });
  return response.areaCode;
};

const promptPartialSearch = async () => {
  const partialSearch = await prompts({
    type: "confirm",
    name: "value",
    message: `Would you like to perform a partial search?`,
    initial: false,
  });
  return partialSearch.value as string;
};

const promptPartialNumber = async (phoneNumberSearchResult: string[]) => {
  printArray(phoneNumberSearchResult);
  const partialOrderResponse = await prompts({
    type: "text",
    name: "partialNumber",
    message: `What partial would you like to search?`,
  });
  return partialOrderResponse.partialNumber;
};

const promptSelectNumber = async (
  phoneNumberSearchResult: string[] | undefined
) => {
  const choices = phoneNumberSearchResult?.map((e) => {
    return { title: e, value: e };
  });
  const selectNumberResponse = await prompts({
    type: "select",
    name: "value",
    message: `Which number would you like to order?`,
    choices: choices,
    initial: 1,
  });
  return selectNumberResponse.value;
};

const promptConfirmOrder = async (phoneNumber: string) => {
  const confirmOrderResponse = await prompts({
    type: "confirm",
    name: "value",
    message: `(y/n) Order number: ${phoneNumber}`,
    initial: true,
  });
  return confirmOrderResponse.value;
};

const main = async () => {
  let areaCode = "919";
  const numberType = await promptNumberType();
  if (numberType === "local") {
    areaCode = await promptAreaCode();
  }
  let phoneNumberSearchResult = await searchNumbers(numberType, areaCode);
  const searchPartial = await promptPartialSearch();
  if (searchPartial && phoneNumberSearchResult) {
    const partialNumber = await promptPartialNumber(phoneNumberSearchResult);
    phoneNumberSearchResult = await searchNumbers(
      numberType,
      areaCode,
      partialNumber
    );
  }
  if (phoneNumberSearchResult?.length === 0) {
    console.log("No available numbers with that criteria");
    return;
  }
  const phoneNumber = await promptSelectNumber(phoneNumberSearchResult);
  const confirmOrderResponse = await promptConfirmOrder(phoneNumber);
  if (!confirmOrderResponse) {
    console.log("Ok, not ordering thanks");
    return;
  }
  const orderResponse = await orderNumber(phoneNumber);
  const phoneNumberObject = await waitForOrderComplete(phoneNumber);
  const updateResponse = await updatePhoneNumber(phoneNumberObject?.data?.id!, {
    billing_group_id: BILLING_GROUP_ID,
    number_level_routing: "disabled",
  });
  console.log(orderResponse);
  console.log(updateResponse);
};

main();
