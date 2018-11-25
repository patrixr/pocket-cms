const _ = require("lodash");

function TEXT(max) {
    let definition = {
        "type": "string",
        "minLength": 1,
    };
    if (max > 0) {
        definition.maxLength = max;
    }
    return definition;
};

function ENUM(strings) {
    return {
        "type": "string",
        "enum": strings
    };
}

function OBJECT() {
    return {
        "type": "object"
    };
}

function PASSWORD() {
    return {
        "type": "password"
    };
}

function MAP_OF(jsonSchema) {
    return {
        "type": "object",
        "additionalProperties": jsonSchema
    }
}

function NUMBER() {
    return { "type": "number" };
}

function EMAIL() {
    return { "type": "string", "format": "email" };
}

function ARRAY(minItems = 0) {
    let definition = {
        "type": "array"
    };
    if (minItems > 0) {
        definition.minItems = minItems;
    }
    return definition;
}

function ARRAY_OF(jsonSchema, minItems = 0) {
    let definition = ARRAY(minItems);
    if (jsonSchema) {
        definition.items = jsonSchema;
    }
    return definition;
}

module.exports = {
    ARRAY_OF,
    ARRAY,
    EMAIL,
    NUMBER,
    OBJECT,
    MAP_OF,
    PASSWORD,
    TEXT,
    ENUM
}