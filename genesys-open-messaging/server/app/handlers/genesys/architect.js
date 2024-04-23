const debugGenesys = require("debug")("app:Genesys");
const platformClient = require("purecloud-platform-client-v2");

const getDataTables = async (req, res) => {
  const { name } = req.body;
  const apiInstance = new platformClient.ArchitectApi();

  try {
    debugGenesys(`Fetching data tables with filter: ${name}`);
    const opts = {
      pageNumber: 1,
      pageSize: 50,
      sortBy: "id",
      sortOrder: "ascending",
      name,
    };
    const response = await apiInstance.getFlowsDatatables(opts);
    debugGenesys(
      `Data tables fetched: ${response.entities.length} records found`
    );
    debugGenesys(response);
    return res.status(200).send(response);
  } catch (error) {
    debugGenesys(`Error fetching data tables:`);
    debugGenesys(error);
    return res.status(400).send({ message: error.message });
  }
};

const getTableRows = async (req, res) => {
  const { id } = req.body;
  const apiInstance = new platformClient.ArchitectApi();

  try {
    debugGenesys(`Fetching table data for ID ${id}`);
    let opts = {
      pageNumber: 1,
      pageSize: 500,
      showbrief: false,
      sortOrder: "ascending",
    };
    const response = await apiInstance.getFlowsDatatableRows(id, opts);
    debugGenesys(`Table data fetched for ID ${id}:`);
    debugGenesys(response);
    // const filter = response.entities.filter((row) => row.id === 6);
    // debugGenesys("Filtered data:");
    // debugGenesys(JSON.parse(filter[0].sms_from_id));
    return res.status(200).send(response);
  } catch (error) {
    debugGenesys(`Error fetching data tables:`);
    debugGenesys(error);
    return res.status(400).send({ message: error.message });
  }
};

module.exports = {
  getDataTables,
  getTableRows,
};
