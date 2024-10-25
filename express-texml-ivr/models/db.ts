import database from "./database.json";

export const lookupUserByPhoneNumber = (phoneNumber: string) =>
  database
    .filter((row) => row.phoneNumber === phoneNumber)
    .reduce(
      (result, row) => (result = row),
      {} as { sip: string[]; pstn: string[]; voicemailUrl: string }
    );
