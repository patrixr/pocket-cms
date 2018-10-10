import Pocket       from "../Pocket"
import log4js       from "log4js"
import _            from "lodash"
import Busboy       from 'busboy'
import Q            from 'q'
import {isNumeric}  from '../utils/helpers'
import { 
    Error, 
    INTERNAL_ERROR,
    RESOURCE_NOT_FOUND }  from "../utils/errors"


const logger = log4js.getLogger();

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
export function preloadResource(req, res, next) {
    const resourceName  = req.params.resource;
    const resource      = Pocket.getResource(resourceName).withContext({ user: req.user, request: req })

    if (!resource) {
        return RESOURCE_NOT_FOUND.send(res);
    }

    req.resource = resource;
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
export const getOne = Handler(async (req, res) => {
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
export const getAll = Handler(async (req, res) => {
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
export const createOne = Handler(async (req, res) => {
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
export const attachFile = Handler((req, res) => {
    const id        = req.params.id;
    const resource  = req.resource;
    
    let deferred = Q.defer();
    let busboy = new Busboy({ headers: req.headers });
    let promises = [];

    busboy.on('file', (fieldname, file, filename) => {
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
export const downloadAttachment = Handler(async (req, res) => {
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
export const deleteAttachment = Handler(async (req, res) => {
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
export const updateOne = Handler(async (req, res) => {
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
export const removeOne = Handler(async (req, res) => {
    const id    = req.params.id;
    await req.resource.removeOne(id);
    res.sendStatus(200);
});