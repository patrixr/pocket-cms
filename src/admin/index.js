const express       = require("express");
const path          = require("path");
const util          = require('util');
const fs            = require("fs");
const _             = require("lodash");
const { FORBIDDEN } = require("../utils/errors");
const Cache         = require("../utils/cache");
const readFile      = util.promisify(fs.readFile);

module.exports = function(pocket) {
  let assetsFolder  = path.resolve(__dirname, '../../dist/admin');
  let router        = express.Router();

  const loadHTML = Cache.once(async (baseUrl) => {
    let rexp = /\/(main\.[^\.]+\.(?:js|css))/g;
    let html = await readFile(path.resolve(assetsFolder, 'index.html'))
    return html.toString().replace(rexp, `${baseUrl}/$1`);
  });

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

  let html = '';
  router.use([
    async (req, res, next) => {
      const trimmedUrl = req.originalUrl.replace(/\/?\?.*$/, '');
      if (!/\/admin$/.test(trimmedUrl)) {
        return next();
      }

      const html = await loadHTML(req.baseUrl);
      res.set('Content-Type', 'text/html');
      res.status(200).send(html);
    },
    express.static(assetsFolder)
  ]);

  return router;
};
