import { apiInstance } from "../utils/axios";

export const checkNumber = async (number, carrierLookup, callerLookup) => {
  return await apiInstance.post("api/nl", {
    carrierLookup,
    callerLookup,
    number,
  });
};
