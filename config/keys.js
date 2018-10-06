let pvault   = require("pvault");
let fs       = require("fs");

var pvaultPassword = process.env.PVAULT_PASSWORD || fs.readFileSync(__dirname + "/.pvault").toString();
var Vault = pvault(__dirname);

module.exports = new Vault("keys", pvaultPassword);