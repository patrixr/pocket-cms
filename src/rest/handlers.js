const  log4js       = require("log4js");
const  _            = require("lodash");
const  Busboy       = require('busboy');
const  Q            = require('q');
const  {isNumeric}  = require('../utils/helpers');
const  {
    Error,
    INTERNAL_ERROR,
    RESOURCE_NOT_FOUND }  = require("../utils/errors");


// ---- Helpers

function Handler(fn) {
    return async (req, res, next) => {
        try {
            await fn(req, res, next);
        } catch (e) {
            Error.fromException(e).send(res);
        }
    }
}


// ---- Handlers

/**
 * Loads the resource specified in the url, and attaches it to the request object
 *
 * ANY /:resource
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function preloadResource(req, res, next) {
    const { pocket, user }  = req.ctx;
    const resourceName      = req.params.resource;
    const resource          = pocket.resource(resourceName);

    if (!resource) {
        return RESOURCE_NOT_FOUND.send(res);
    }

    req.resource = resource.withContext({ user: user, request: req });
    next();
}

/**
 * Returns a single record
 *
 * GET /:resource/:id
 *
 * @param {*} req
 * @param {*} res
 */
const getOne = Handler(async (req, res) => {
    const id        = req.params.id;
    const userId    = req.params.userId;
    const record    = await req.resource.get(id);

    if (!record)
        throw RESOURCE_NOT_FOUND;

    if (userId && record._createdBy != userId)
        throw RESOURCE_NOT_FOUND;

    res.json(record);
});

/**
 * Returns the complete list of records for a given resource
 *
 * GET /:resource
 *
 * @param {*} req
 * @param {*} res
 */
const getAll = Handler(async (req, res) => {
    const { page, pageSize } = req.query;
    const { userId }         = req.params;

    const paginationOptions = {};
    if (isNumeric(pageSize)) {
        paginationOptions.pageSize = Number(pageSize);
        if (isNumeric(page)) {
            paginationOptions.page = Number(page);
        }
    }

    let query = {};
    if (userId) {
        query._createdBy = userId;
    }

    const records = await req.resource.find(query, paginationOptions);

    const meta = records.meta;
    if (meta) {
        res.set('X-Total-Pages', meta.totalPages);
        res.set('X-Per-Page', meta.pageSize);
        res.set('X-Page', meta.page);
    }
    res.json(records);
})

/**
 * Create a new record
 *
 * POST /:resource
 *
 * @param {*} req
 * @param {*} res
 */
const createOne = Handler(async (req, res) => {
    const userId = req.params.userId;
    let record = await req.resource.create(req.body, { userId });
    res.json(record);
});

/**
 * Attach a file to a rectod
 *
 * POST /:resource/:id/attachments
 *
 * @param {*} req
 * @param {*} res
 */
const attachFile = Handler((req, res) => {
    const id        = req.params.id;
    const resource  = req.resource;

    let deferred = Q.defer();
    let busboy = new Busboy({ headers: req.headers });
    let promises = [];

    busboy.on('file', (fieldname, file) => {
        promises.push(resource.attach(id, fieldname, file));
    });

    busboy.on('finish', function() {
        Q.all(promises)
            .then(() => {
                return resource.get(id)
            })
            .then((record) => {
                if (!record) {
                    RESOURCE_NOT_FOUND.send(res);
                } else {
                    res.json(record)
                }
            })
            .catch((e) => {
                deferred.reject(e);
            });
    });

    req.pipe(busboy);

    return deferred.promise;
});

/**
 * Download an attachment
 *
 * GET /:resource/:id/attachments/:attachmentId
 *
 * @param {*} req
 * @param {*} res
 */
const downloadAttachment = Handler(async (req, res) => {
    const id        = req.params.id;
    const attId     = req.params.attachmentId;
    const resource  = req.resource;
    const record    = await req.resource.get(id);

    if (!record) {
        throw RESOURCE_NOT_FOUND;
    }

    let attachment = _.find(record._attachments, ['id', attId]);
    if (!attachment) {
        throw RESOURCE_NOT_FOUND;
    }

    let stream = resource.readAttachment(attachment.file);
    res.set('content-type', attachment.mimeType || 'application/octet-stream');
    res.set('content-length', attachment.size);
    stream
        .on('error', err => {
            INTERNAL_ERROR.send(res);
        })
        .pipe(res);
});

/**
 * Delete an attachment
 *
 * Delete /:resource/:id/attachments/:attachmentId
 *
 * @param {*} req
 * @param {*} res
 */
const deleteAttachment = Handler(async (req, res) => {
    const id        = req.params.id;
    const attId     = req.params.attachmentId;

    let record = await req.resource.deleteAttachment(id, attId);
    res.json(record);
});

/**
 * Update a new record
 *
 * POST /:resource/:id
 *
 * @param {*} req
 * @param {*} res
 */
const updateOne = Handler(async (req, res) => {
    const id    = req.params.id;
    let record = await req.resource.mergeOne(id, req.body);
    res.json(record);
});


/**
 * Removes a record
 *
 * DELETE /:resource:/:id
 *
 * @param {*} req
 * @param {*} res
 */
const removeOne = Handler(async (req, res) => {
    const id    = req.params.id;
    await req.resource.removeOne(id);
    res.sendStatus(200);
});

module.exports = {
    removeOne,
    updateOne,
    deleteAttachment,
    downloadAttachment,
    attachFile,
    createOne,
    getAll,
    getOne,
    preloadResource
}