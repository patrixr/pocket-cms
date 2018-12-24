const _                      = require("lodash");
const { Validator }          = require("jsonschema");
const { JsonSchemaBuilder }  = require("./mapper");
const { asyncEach }          = require('../utils/helpers');

const ALLOWED_ACTIONS = ['read', 'create', 'update', 'remove'];

const ACTION_ALIASES = {
  'delete': 'remove',
  'insert': 'create',
  'add': 'create',
  'get': 'read'
};

const ALIASES = {
  "string": "text",
  "json": "object",
  "enum": "select",
  "list": "array"
}

const builder = new JsonSchemaBuilder();

class Schema {
  constructor({ fields, additionalProperties }) {
    this.fields = this.normalizeSchema(fields);
    this.jsonSchema = builder.build(this.fields, { additionalProperties });
    this.clearHooks();
    this.permissions = {};
  }

  normalizeField(field) {
    let normalized = _.isString(field) ? { type: field } : field;
    if (ALIASES[normalized.type]) {
      normalized.type = ALIASES[normalized.type]
    }
    if (normalized.schema) {
      normalized.schema = this.normalizeSchema(normalized.schema);
    }
    if (normalized.items) {
      normalized.items = this.normalizeField(normalized.items);
    }
    return normalized;
  }

  normalizeSchema(fields) {
    for (let key in fields) {
      fields[key] = this.normalizeField(fields[key]);
    }
    return fields;
  }

  indices() {
    return _.chain(this.fields)
      .pickBy(f => !!f.index)
      .map(({ index }, key) => {
        return {
          field: key,
          unique: _.isObject(index) && !!index.unique
        };
      })
      .value();
  }

  //
  // ---- ACL
  //

  _trimActions(actions) {
    return _.chain(actions)
      .map(_.lowerCase)
      .map(act => ACTION_ALIASES[act] || act)
      .filter(act => _.includes(ALLOWED_ACTIONS, act))
      .uniq()
      .value();
  }

  allow(group, actions) {
    const rights = this.permissions[group] || [];
    this._trimActions(actions)
      .forEach(action => {
        rights.push(action);
      });
    this.permissions[group] = _.uniq(rights);
  }

  deny(group, actions) {
    const rights = this.permissions[group] || [];
    this._trimActions(actions)
      .forEach(actions, action => {
        _.remove(rights, (r) => _.eq(r, action));
      });
    this.permissions[group] = _.uniq(rights);
  }

  userIsAllowed(user, action) {
    return !!_.find(user.groups, g => this.groupIsAllowed(g, action));
  }

  groupIsAllowed(group, action) {
    if (group !== "*") {
      if (this.groupIsAllowed("*", action)) {
        return true;
      }
    }
    const rights = this.permissions[group];
    return _.includes(rights, action)
  }

  //
  // ---- VALIDATION
  //

  validate(data, opts = {}) {
    const {
      additionalProperties = false,
      ignoreRequired = false
    } = opts;

    let schema = _.extend({}, this.jsonSchema);
    if (ignoreRequired) {
      schema = _.omit(schema, "required");
    }
    if (additionalProperties) {
      schema.additionalProperties = true;
    }

    return new Validator()
      .validate(data, schema)
      .errors.map(e => `${e.property} ${e.message}`);
  }

  //
  // ---- HOOKS
  //

  before(method, fn) {
    if (!this.hooks.before[method]) {
      this.hooks.before[method] = [];
    }
    this.hooks.before[method].push(fn);
    return this;
  }

  after(method, fn) {
    if (!this.hooks.after[method]) {
      this.hooks.after[method] = [];
    }
    this.hooks.after[method].push(fn);
    return this;
  }

  runHooks(data, context) {
    const run = async hooks => {
      await asyncEach(hooks, async hook => {
        await hook(data, context);
      });
    };
    return {
      after: async (...methods) => {
        for (let method of methods)
          await run(this.hooks.after[method] || []);
      },
      before: async (...methods) => {
        for (let method of methods)
          await run(this.hooks.before[method] || []);
      }
    };
  }

  clearHooks() {
    this.hooks = {
      before: {},
      after: {}
    };
  }
}

module.exports = Schema;