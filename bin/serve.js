var express = require("express");
var log4js = require("log4js");
var Pocket = require("../src/pocket");

let logger = log4js.getLogger();
let server = express();
let port = 8000;

logger.level = "info";

const pocket = new Pocket();

const post = new pocket.Schema({
  fields: {
    type: {
      type: "select",
      options: ["media", "statistics", "achievement"]
    },
    message: "string",
    stats: {
      type: "list",
      minItems: 1,
      items: {
        type: "object",
        schema: {
          key: "string",
          value: "number"
        }
      }
    }
  }
})
.before('validate', ({ record }) => {
  record.stats = record.stats || [];
});

pocket.resource("posts", post);

server.use('/', pocket.middleware());

server.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
