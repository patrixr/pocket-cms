
const env     = require("../utils/env");
const config  = require("../utils/config");
const {
  Error,
  FORBIDDEN,
  UNAUTHORIZED
} = require("../utils/errors");

class Policies {

  constructor() {
    this.rules = [];
  }

  rule(desc, fn) {
    this.rules.push({ desc, fn });
  }

  middleware() {
    return async (req, res, next) => {
      let resolved = false;

      const allow = () => {
        if (!resolved) {
          resolved = true;
          next();
        }
      }

      const deny = () => {
        if (!resolved) {
          throw FORBIDDEN
        }
      }

      for (let i = 0; !resolved && i < this.rules.length; ++i) {
        const { fn } = this.rules[i];
        try {
          await fn(req, allow, deny);
        } catch (e) {
          if (!resolved) {
            return Error.fromException(e).send(res);
          }
        }
      }

      if (!resolved) {
        FORBIDDEN.send(res);
      }
    }
  }
}


const policies = new Policies();

const ACTION_MAP = {
  POST: 'create',
  GET: 'read',
  DELETE: 'remove',
  PUT: 'update'
};

policies.rule("We can access resources while testing", (req, allow, deny) => {
  if (env() === "test" && config.testing.disableAuthentication) {
    allow();
  }
});

// policies.rule("Reading an attachment is made public", (req, allow) => {
//   console.log(req.baseUrl);
// });

policies.rule("A user is required to access cms resources", (req, allow, deny) => {
  if (!req.ctx.user) {
    throw UNAUTHORIZED;
  }
});

policies.rule("Admins have all access", (req, allow) => {
  if (req.ctx.user.isAdmin()) {
    allow();
  }
});

policies.rule("Private CMS resources are not accessible by non-admins", (req, allow, deny) => {
  const { ctx: { user }, params } = req;
  if (!user.isAdmin() && /^_/.test(params.resource)) {
    deny();
  }
});

policies.rule("User can access resource if his/her group is whitelisted by the schema", (req, allow, deny) => {
  const pocket    = req.ctx.pocket;
  const resource  = req.params.resource;
  const action    = ACTION_MAP[req.method.toUpperCase()];
  const schema    = pocket.schemaOf(resource);

  if (schema && schema.userIsAllowed(req.ctx.user, action)) {
    allow();
  }
});

policies.rule("User can access resource if his group has permission", async (req, allow, deny) => {
  const resource  = req.params.resource;
  const action    = ACTION_MAP[req.method.toUpperCase()];

  if (await req.ctx.user.isAllowed(action, resource)) {
    allow();
  }
});

module.exports = policies;