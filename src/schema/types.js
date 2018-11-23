import _ from "lodash"

export function TEXT(max) {
    let definition = {
        "type": "string",
        "minLength": 1,
    };
    if (max > 0) {
        definition.maxLength = max;
    }
    return definition;
};

export function ENUM(strings) {
    return {
        "type": "string",
        "enum": strings
    };
}

export function OBJECT() {
    return {
        "type": "object"
    };
}

export function PASSWORD() {
    return {
        "type": "password"
    };
}

export function MAP_OF(jsonSchema) {
    return {
        "type": "object",
        "additionalProperties": jsonSchema
    }
}

export function NUMBER() {
    return { "type": "number" };
}

export function EMAIL() {
    return { "type": "string", "format": "email" };
}

export function ARRAY(minItems = 0) {
    let definition = {
        "type": "array"
    };
    if (minItems > 0) {
        definition.minItems = minItems;
    }
    return definition;
}

export function ARRAY_OF(jsonSchema, minItems = 0) {
    let definition = ARRAY(minItems);
    if (jsonSchema) {
        definition.items = jsonSchema;
    }
    return definition;
}