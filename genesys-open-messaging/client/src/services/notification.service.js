import { gcApiInstance } from "../utils/axios";

export const createNotificationChannel = async () => {
  return await gcApiInstance.post("api/v2/notifications/channels");
};

export const getChannelSubscriptions = async (id) => {
  return await gcApiInstance.get(
    `api/v2/notifications/channels/${id}/subscriptions`
  );
};

export const createChannelSubscriptions = async (id, subscriptions) => {
  return await gcApiInstance.put(
    `api/v2/notifications/channels/${id}/subscriptions`,
    subscriptions
  );
};

export const deleteChannelSubscriptions = async (id) => {
  return await gcApiInstance.delete(
    `api/v2/notifications/channels/${id}/subscriptions`
  );
};
