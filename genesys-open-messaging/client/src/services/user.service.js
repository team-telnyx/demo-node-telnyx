import { gcApiInstance } from "../utils/axios";

export const getUserMe = async () => {
  return await gcApiInstance.get("api/v2/users/me");
};

export const getQueuesMe = async () => {
  return await gcApiInstance.get("api/v2/routing/queues/me");
};
