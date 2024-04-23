import { gcApiInstance } from "../utils/axios";

export const getSMSLibrary = async (libraryPrefix) => {
  return await gcApiInstance.get("api/v2/responsemanagement/libraries", {
    params: { libraryPrefix, pageSize: 250 },
  });
};

export const getSMSResponse = async (libraryId) => {
  return await gcApiInstance.get("api/v2/responsemanagement/responses", {
    params: { libraryId, pageSize: 250 },
  });
};
