const debugGenesys = require("debug")("app:Genesys");
const platformClient = require("purecloud-platform-client-v2");
const axios = require("axios");

const getClientGrant = async () => {
  try {
    const client = platformClient.ApiClient.instance;
    client.setEnvironment(process.env.GC_ENVIRONMENT);
    const clientGrant = await client.loginClientCredentialsGrant(
      process.env.GC_CLIENT_CRED_CLIENT_ID,
      process.env.GC_CLIENT_CRED_CLIENT_SECRET
    );
    debugGenesys(`Genesys Cloud client grant created.`);
    debugGenesys(clientGrant);
    return clientGrant.accessToken;
  } catch (error) {
    debugGenesys("getClientGrant error:");
    debugGenesys(error?.response?.data);
    return null;
  }
};

const getAuthToken = async (req, res) => {
  const { code, redirect_uri, refresh_token } = req.body;

  if (!refresh_token && !code) {
    return res
      .status(400)
      .send({ message: "No code or refresh token provided." });
  }

  debugGenesys(
    refresh_token
      ? "Refreshing Genesys Cloud authentication token..."
      : "Requesting Genesys Cloud authentication token..."
  );

  const url = `https://login.${process.env.GC_ENVIRONMENT}/oauth/token`;
  const data = code
    ? `grant_type=authorization_code&code=${code}&redirect_uri=${redirect_uri}`
    : refresh_token
    ? `grant_type=refresh_token&refresh_token=${refresh_token}`
    : null;

  try {
    const result = await axios({
      url,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(
          `${process.env.GC_CLIENT_ID}:${process.env.GC_CLIENT_SECRET}`
        )}`,
      },
      method: "POST",
      data,
    });
    debugGenesys("Genesys Cloud authentication token created:");
    debugGenesys(result.data);
    res.status(200).send(result.data);
  } catch (error) {
    debugGenesys("getAuthToken error:");
    debugGenesys(error?.response?.data);
    res
      .status(error.toJSON().status)
      .send(
        error?.response?.data
          ? error.response.data
          : { message: error.message.toString() }
      );
  }
};

const checkAuthToken = async (req, res) => {
  const token = req.headers.token;

  debugGenesys(`Checking Genesys Cloud authentication token...`);

  try {
    const response = await axios({
      url: `https://api.${process.env.GC_ENVIRONMENT}/api/v2/tokens/me`,
      method: "get",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      // validateStatus: () => true,
    });
    debugGenesys(response.data);
    res.status(200).send(response.data);
  } catch (error) {
    debugGenesys("checkAuthToken error:");
    debugGenesys(error?.response?.data);
    res
      .status(error.toJSON().status)
      .send(
        error?.response?.data
          ? error.response.data
          : { message: error.message.toString() }
      );
  }
};

module.exports = {
  getClientGrant,
  getAuthToken,
  checkAuthToken,
};
