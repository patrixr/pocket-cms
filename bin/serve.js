var express = require("express");
var Pocket = require("../src/pocket");
var { Schema } = require("../src/pocket");

let server = express();
let port = 8000;

const pocket = new Pocket();

  const post = new Schema({
  fields: {
    type: {
      type: "select",
      options: ["media", "statistics", "achievement"]
    },
    multiselect: {
      type: "multiselect",
      options: ["opt1", "opt2", "opt3"]
    },
    message: "string",
    color: "color",
    count: {
      required: true,
      type: "number",
      default: 33
    },
    boolean: {
      type:"boolean"
    },
    checkbox: {
      type: "checkbox"
    },
    isNotNice: {
      type: "boolean",
      computed: true,
      compute(data) {
        return !data.isNice;
      }
    },
    time: {
      type: "time",
    },
    date: {
      type: "date"
    },
    datetime: {
      type: "datetime"
    },
    timestamp: {
      type: "timestamp"
    },
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
