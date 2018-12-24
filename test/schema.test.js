const { expect } = require("chai");
const { JsonSchemaBuilder } = require("../src/schema/mapper");
const _ = require("lodash");

describe("Schemas", () => {
  describe("JsonSchema Builder", () => {
    const builder = new JsonSchemaBuilder();

    const schemaWithType = type => ({
      myProp: { type }
    });

    it("Should not support unknown types", () => {
      expect(function() {
        builder.build(schemaWithType("meteorite"));
      }).to.throw();
    });

    _.each([
      "text",
      "enum",
      "object",
      "number",
      "email"
    ], type => {
      it(`Should support the ${type} type`, () => {
        expect(() => {
          builder.build(schemaWithType(type));
        }).to.not.throw();
      });
    });

    it("Should convert props to valid jsonschema", () => {
      const jsonSchema = builder.build({
        firstName: "text",
        lastName: {
          type: "text"
        },
        age: {
          type: "number"
        },
        phone: {
          type: "text",
          maxLength: 8
        },
        gender: {
          type: "enum",
          options: ["alien", "dancer"]
        },
        email: {
          type: "email",
          required: true
        },
        bankAccount: {
          type: "object"
        },
        props: {
          type: "object",
          schema: {
            hairColor: "text",
            eyeColor: {
              type: "text",
              required: true
            }
          }
        }
      });

      expect(jsonSchema).to.deep.equal({
        type: "object",
        required: ["email"],
        additionalProperties: false,
        properties: {
          firstName: {
            minLength: 1,
            type: "string"
          },
          lastName: {
            minLength: 1,
            type: "string"
          },
          age: {
            type: "number"
          },
          phone: {
            type: "string",
            maxLength: 8,
            minLength: 1
          },
          gender: {
            type: "string",
            enum: ["alien", "dancer"]
          },
          email: {
            type: "string",
            format: "email"
          },
          bankAccount: {
            type: "object"
          },
          props: {
            type: "object",
            required: ["eyeColor"],
            additionalProperties: false,
            properties: {
              hairColor: {
                minLength: 1,
                type: "string"
              },
              eyeColor: {
                minLength: 1,
                type: "string"
              }
            }
          }
        }
      });
    });
  });
});
