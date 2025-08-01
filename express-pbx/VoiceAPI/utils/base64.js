const toBase64 = (data) => new Buffer.from(data).toString("base64");
const fromBase64 = (data) => new Buffer.from(data, "base64").toString();

export { toBase64, fromBase64 };