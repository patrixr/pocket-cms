const { Router }  = require("express");
const handlers    = require("./handlers");
const bodyParser  = require("body-parser");
const policies    = require("./policies");

const ACTION_MAP = {
  POST: "create",
  GET: "read",
  DELETE: "remove",
  PUT: "update"
};

module.exports = function(pocket) {
  let router = Router();

  const prefix = endpoint => `(/users/:userId)?${endpoint}`;

  router.use(bodyParser.json());
  router.use((req, res, next) => {
    // Attach pocket to request
    req.ctx = req.ctx || {};
    req.ctx.pocket = pocket;
    next();
  });

  // Prepare
  router.use(prefix("/:resource"), handlers.preloadResource);

  // Public
  router.get(prefix("/:resource/:id/attachments/:attachmentId"), handlers.downloadAttachment);

  // Private
  router.use("(/users/:userId)?/:resource", policies.middleware());
  router.delete(prefix("/:resource/:id/attachments/:attachmentId"), handlers.deleteAttachment);
  router.get(prefix("/:resource/:id"), handlers.getOne);
  router.post(prefix("/:resource/:id/attachments"), handlers.attachFile);
  router.put(prefix("/:resource/:id"), handlers.updateOne);
  router.delete(prefix("/:resource/:id"), handlers.removeOne);
  router.get(prefix("/:resource"), handlers.getAll);
  router.post(prefix("/:resource"), handlers.createOne);

  return router;
};
