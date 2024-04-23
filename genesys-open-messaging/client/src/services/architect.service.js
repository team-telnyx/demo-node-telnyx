import { gcApiInstance } from "../utils/axios";

export const getDataTables = async (name) => {
  return await gcApiInstance.get("api/v2/flows/datatables", {
    // headers: { Authorization: `Bearer ${accessToken}` },
    params: { name },
  });
};

export const getTableRows = async (datatableId) => {
  return await gcApiInstance.get(
    `api/v2/flows/datatables/${datatableId}/rows`,
    {
      // headers: { Authorization: `Bearer ${accessToken}` },
      params: { showbrief: false, sortOrder: "ascending", pageSize: 250 },
    }
  );
};
