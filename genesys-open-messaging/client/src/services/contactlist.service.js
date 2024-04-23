import { gcApiInstance } from "../utils/axios";
import csvtojson from "csvtojson";

export const getContactLists = async (name) => {
  return await gcApiInstance.get("api/v2/outbound/contactlists", {
    params: {
      name,
      pageSize: 250,
      includeSize: true,
      sortOrder: "ascending",
    },
  });
};

export const createContactListExport = async (contactListId) => {
  return await gcApiInstance.post(
    `api/v2/outbound/contactlists/${contactListId}/export`
  );
};

export const getContactListExport = async (contactListId) => {
  return await gcApiInstance.get(
    `api/v2/outbound/contactlists/${contactListId}/export?download=true?page=1&pageSize=100`
  );
};

export const getContactListFile = async (url) => {
  console.log("Getting contact list export file...");

  try {
    const response = await gcApiInstance.get(url, {}, { responseType: "blob" });

    const contacts = await csvtojson({
      noheader: false,
      output: "json",
    }).fromString(response.data);
    console.log("Contacts:", contacts);
    return contacts;
  } catch (error) {
    console.log("Error getting GC contact list export file");
    console.log(error.message);
    return [];
  }
};
