import { apiInstance } from "../utils/axios";

export const startCampaign = async (
  contactListId,
  campaignType,
  template,
  contactListColumns
) => {
  return await apiInstance.post("api/genesys/campaign/start", {
    contactListId,
    campaignType,
    template,
    contactListColumns,
  });
};
