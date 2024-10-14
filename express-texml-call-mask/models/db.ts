import phoneNumbersTable from "./phoneNumbersTable.json";

export const lookupUserByPSTNPhoneNumber = (phoneNumber: string) =>
  phoneNumbersTable.filter((row) => row.pstnPhoneNumber === phoneNumber).at(0);
