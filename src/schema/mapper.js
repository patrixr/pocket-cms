const _ = require("lodash");
const { TEXT, ENUM, NUMBER, OBJECT, EMAIL, ARRAY_OF, ARRAY, PASSWORD, MAP_OF} = require("./types");

/**
 * Creates a JsonSchema out of a Pocket Schema
 *
 * @class JsonSchemaBuilder
 */
class JsonSchemaBuilder {
  constructor() {
    this.mapping = {
      number: () => {
        return NUMBER();
      },
      text: typeDesc => {
        return TEXT(typeDesc.maxLength);
      },
      password: () => {
        return PASSWORD();
      },
      object: ({ schema }) => {
        if (schema) {
          return this.build(schema);
        }
        return OBJECT();
      },
      enum: ({ options }) => {
        return ENUM(options);
      },
      email: () => {
          return EMAIL();
      },
      array: ({ minItems, items }) => {
          if (!items) {
              return ARRAY(minItems);
          }
          return ARRAY_OF(this.convertProp(items));
      },
      map: ({ items }) => {
        return MAP_OF(this.convertProp(items));
      },
      string: this.alias("text"),
      json: this.alias("object"),
      select: this.alias("enum"),
      list: this.alias('array')
    };
  }

  alias(type) {
    return typedesc => {
      return this.mapping[type](typedesc);
    };
  }

  convertProp(typeDesc) {
    if (_.isString(typeDesc)) {
      typeDesc = { type: typeDesc };
    }
    return this.mapping[typeDesc.type](typeDesc);
  }

  build(pocketSchema) {
    let properties = {};
    let required = [];
    _.each(pocketSchema, (typeDesc, propName) => {
      properties[propName] = this.convertProp(typeDesc);
      if (typeDesc.required) {
          required.push(propName);
      }
    });
    return {
      type: "object",
      properties,
      required,
      additionalProperties: false
    };
  }
}

module.exports = { JsonSchemaBuilder };