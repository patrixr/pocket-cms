var express = require("express");
var Pocket = require("../src/pocket");
var { Schema } = require("../src/pocket");

let server = express();
let port = 8000;

logger.level = "info";

const pocket = new Pocket();

  const post = new Schema({
  fields: {
    type: {
      type: "select",
      options: ["media", "statistics", "achievement"]
    },
    message: "string",
    meta: {
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
  console.info(`Server running on port ${port}`);
});
