module.exports = {
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
};
