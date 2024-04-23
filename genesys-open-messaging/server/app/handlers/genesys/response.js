const debugGenesys = require("debug")("app:Genesys");
const platformClient = require("purecloud-platform-client-v2");

const getSMSResponse = async (req, res) => {
  const { libraryId } = req.body;
  const apiInstance = new platformClient.ResponseManagementApi();

  try {
    debugGenesys("Fetching SMS templates...");

    const opts = {
      pageNumber: 1,
      pageSize: 500,
      // expand: "expand_example",
    };
    const response = await apiInstance.getResponsemanagementResponses(
      libraryId,
      opts
    );

    debugGenesys(
      `SMS response templates fetched: ${response.entities.length} records found`
    );
    debugGenesys(response?.entities);

    return res.status(200).send(response);
  } catch (error) {
    debugGenesys(`Error fetching response templates:`);
    debugGenesys(error);
    return res.status(400).send({ message: error.message });
  }
};

const getSMSLibrary = async (req, res) => {
  const { libraryPrefix } = req.body;
  const apiInstance = new platformClient.ResponseManagementApi();

  try {
    debugGenesys("Fetching SMS response libraries...");

    let opts = {
      pageNumber: 1, // Number | Page number
      pageSize: 500, // Number | Page size
      libraryPrefix: libraryPrefix,
    };
    const response = await apiInstance.getResponsemanagementLibraries(opts);

    debugGenesys(
      `SMS response libraries fetched: ${response.entities.length} records found`
    );
    debugGenesys(response?.entities);

    return res.status(200).send(response);
  } catch (error) {
    debugGenesys(`Error fetching response libraries:`);
    debugGenesys(error);
    return res.status(400).send({ message: error.message });
  }
};

module.exports = {
  getSMSResponse,
  getSMSLibrary,
};
