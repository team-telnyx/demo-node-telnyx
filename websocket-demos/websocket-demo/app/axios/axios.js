const axios = require("axios").default;

exports.sendRequest = async (config) => {
  return new Promise(async (resolve, reject) => {
    try {
      await axios(config)
        .then((response) => {
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    } catch (error) {
      reject(error);
    }
  });
};
