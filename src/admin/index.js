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

  // ---- Helpers

  // Inject the baseUrl into the html file to support
  // having the assets available regardless which endpoint the CMS is mounted on.
  // Alternative : use parcel programatically, and set the 'public-url' based on the
  // mounted endpoint
  //
  const loadHTML = Cache.once(async (baseUrl) => {
    let rexp = /\/(main\.[^\.]+\.(?:js|css))/g;
    let html = await readFile(path.resolve(assetsFolder, 'index.html'));

    return html.toString().replace(rexp, `${baseUrl}/$1`);
  });

  // Lock certain endpoints for non-admins
  //
  const adminOnly = (req, res, next) => {
    const user = _.get(req, "ctx.user");
    if (!user || !user.isAdmin()) {
      return FORBIDDEN.send(res);
    }
    next();
  }

  // ---- Middlewares

  // Returns all the Pocket schemas
  // They are used to generate the list of resources, and the input fields
  //
  router.use("/schemas", adminOnly, (req, res) => {
    const schemas = _.map(pocket.resources, ({ schema }) => {
      return {
        name,
        fields: schema.fields
      };
    });
    res.json(schemas);
  });

  router.use([
    // ---- if index.html
    async (req, res, next) => {
      const trimmedUrl = req.originalUrl.replace(/\/?\?.*$/, '');
      if (!/\/admin$/.test(trimmedUrl)) {
        return next();
      }

      const html = await loadHTML(req.baseUrl);
      res.set('Content-Type', 'text/html');
      res.status(200).send(html);
    },

    // ---- else
    express.static(assetsFolder)
  ]);

  return router;
};
