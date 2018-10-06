import { TEXT, ENUM, NUMBER, OBJECT_STRICT } from "../../../src/utils/schemaUtils";

module.exports = {
  title: "Post",
  type: "object",
  properties: {
    type: ENUM(["media", "statistics", "achievement"]),
    message: TEXT(256),
    stats: {
      type: "array",
      minItems: 1,
      items: OBJECT_STRICT({
        key: TEXT(),
        value: NUMBER()
      })
    }
  },
  anyOf: [
    {
      properties: {
        type: { enum: ["statistics"] }
      },
      required: ["stats"]
    },
    {
      properties: {
        type: { enum: ["achievement"] }
      },
      required: ["message"]
    },
    {
      properties: {
        type: { enum: ["media"] }
      }
    }
  ],
  required: ["type"],
  additionalProperties: false
};
