import { gcApiInstance } from "../utils/axios";

export const getConversations = async () => {
  return await gcApiInstance.get(`api/v2/conversations?communicationType=call`);
};
