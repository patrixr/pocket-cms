import _ from "lodash"

export function TEXT(max) {
    let definition = {
        "type": "string",
        "minLength": 1,
    };
    if (max) {
        definition.maxLenght = max;
    }
    return definition;
};

export function ENUM(strings) {
    return {
        "type": "string",
        "enum": strings
    };
}

export function OBJECT_STRICT(props) {
    return {
        "type": "object",
        "properties": props,
        required: _.keys(props)
    };
}

export function NUMBER() {
    return { "type": "number" };
}