import { apiInstance } from "../utils/axios";

export const gcRedirectUri = (url, state) => {
  const redirectUri =
    `https://login.${process.env.REACT_APP_GC_ENVIRONMENT}/oauth/authorize?` +
    "response_type=code" +
    "&client_id=" +
    process.env.REACT_APP_GC_CLIENT_ID +
    `&redirect_uri=${url}` +
    `&state=${state}`;

  console.log("Redirect URI: ", redirectUri);

  return redirectUri;
};

export const gcGetToken = async (code, redirect_uri, refresh_token) => {
  return await apiInstance.post("api/genesys/token/get", {
    code,
    redirect_uri,
    refresh_token,
  });
};

export const gcCheckToken = async () => {
  return await apiInstance.get("api/genesys/token/check");
};
