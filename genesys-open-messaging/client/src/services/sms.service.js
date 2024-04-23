import { apiInstance } from "../utils/axios";

export const sendSMS = async (senderId, number, text) => {
  return await apiInstance.post("api/sms/send", { senderId, number, text });
};

export const sendAgentlessMessage = async (senderId, number, text) => {
  return await apiInstance.post("api/genesys/sms/agentless", {
    senderId,
    number,
    text,
  });
};
