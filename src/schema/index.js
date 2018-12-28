const _                      = require('lodash');
const { asyncEach }          = require('../utils/helpers');
const BaseSchema             = require('pocket-schema');

const ALLOWED_ACTIONS = ['read', 'create', 'update', 'remove'];

const ACTION_ALIASES = {
  'delete': 'remove',
  'insert': 'create',
  'add': 'create',
  'get': 'read'
};

class Schema extends BaseSchema {
  constructor() {
    super(...arguments);
    this.clearHooks();
    this.permissions = {};
  }

  indices() {
    return _.chain(this.fields)
      .filter('index')
      .map(({ name, index }) => {
        return {
          field: name,
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