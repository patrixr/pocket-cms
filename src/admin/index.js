const express       = require("express");
const _             = require("lodash");
const { FORBIDDEN } = require("../utils/errors");

module.exports = function(pocket) {
  let router = express.Router();

  const adminOnly = (req, res, next) => {
    const user = _.get(req, "ctx.user");
    if (!user || !user.isAdmin()) {
      return FORBIDDEN.send(res);
    }
    next();
  }

  router.use("/schemas", adminOnly, (req, res) => {
    const schemas = _.map(pocket.resources, ({ schema }, name) => {
      return {
        name,
        fields: schema.fields
      };
    });
    res.json(schemas);
  });

  router.use(express.static("dist/admin"));

  return router;
};
