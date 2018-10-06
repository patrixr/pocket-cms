import Datastore        from "nedb"
import path             from "path"
import config           from "../config"
import env              from "../config/env"
import Q                from "q"
import _                from "lodash"
import log4js           from "log4js"
import { promisify }    from "./utils/helpers"
import { Error }        from "./utils/errors"
import { Validator }    from "jsonschema"
import {LocalFileStore} from './stores/files/LocalFileStore';

const logger = log4js.getLogger();
const reservedProperties = [ 
    "_id",
    "_userId",
    "_createdAt", 
    "_updatedAt",
    "_attachments"
];

/**
 * 
 * 
 * @export
 * @class Resource
 */
export class Resource {

    constructor(name, schema) {
        this.name = name;
        this.schema = schema;

        // ---- Stores
        this.filename       = path.join(config.dataFolder, name + ".db");
        this.store          = new Datastore({ filename:  this.filename, autoload: true  });
        this.attachments    = new LocalFileStore(config.uploadFolder);

        _.each(schema.properties, (desc, name) => {
            if (desc.unique) {
                this.store.ensureIndex({ fieldName: name, unique: true }, (err) => {
                    if (err) {
                        logger.error(err)
                    }
                });
            }
        });
    }

    // ---- Helpers

    validate(data, opts = {}) {
        let { isUpdate = false } = opts;

        // We don't try to validate internal properties
        let stripped = _.omit(data, reservedProperties);

        // We remove the required fields in order to support partial updates
        let schema   = isUpdate ? _.omit(this.schema, 'required') : this.schema;

        let results  = new Validator().validate(stripped, schema);

        if (results.errors.length > 0) {
            let msg = results.errors.map((e) => e.property + " " + e.message).join("\n");
            return Q.reject(new Error(400, msg));
        }

        return Q.resolve(stripped);
    }

    // ---- Methods

    get(id) {
        return this.findOne({ _id: id });
    }

    findOne(query = {}) {
        let run = promisify(this.store.findOne, this.store);
        return run(query);
    }

    find(query = {}, opts = {}) {
        let deferred = Q.defer();
        // let run = promisify(this.store.find, this.store);
        // return run(query);
        let transaction = this.store.find(query);

        if (_.isNumber(opts.pageSize)) {
            if (_.isNumber(opts.page)) {
                let page = opts.page > 0 ? opts.page - 1 : 0; // Pages are 1 indexed
                transaction = transaction.skip(page * opts.pageSize);
            }
            transaction = transaction.limit(opts.pageSize);
        }

        transaction.exec((err, result) => {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(result);
            }
        });

        return deferred.promise;
    }

    create(payload, opts = {}) {
        const { userId = null } = opts;
        return this.validate(payload)
            .then((data) => {
                let insert = promisify(this.store.insert, this.store);
                data._createdAt = Date.now();
                data._updatedAt = Date.now();
                data._attachments = [];
                data._userId = userId;
                return insert(data);
            });
    }

    update(id, payload, opts = {}) {
        let { skipValidation } = opts;

        let validate = skipValidation ?
            Q.resolve(payload)
            : this.validate(payload, { isUpdate: true });

        return validate
            .then((data) => {
                return this.updateRaw(id, { $set: data });
            });
    }

    updateRaw(id, operations) {
        let deferred = Q.defer();
        this.store.update({ _id: id }, operations, { returnUpdatedDocs: true }, (err, count, record) => {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(record);
            }
        });
        return deferred.promise;
    }
    
    remove(id) {
        let remove = promisify(this.store.remove, this.store);
        return remove({ _id: id }, {});
    }

    drop() {
        if (env() !== "test") {
            throw "Dropping a database is only allowed in test mode"
        }

        let deferred = Q.defer();

        this.store.remove({ }, { multi: true }, (err, numRemoved) => {
            this.store.loadDatabase(function (err) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve();
                }
            });
        });

        return deferred.promise;
    }

    /**
     * 
     * 
     * @param {String} recordId
     * @param {String} name 
     * @param {Stream|String} file 
     * @memberof Resource
     */
    async attach(recordId, name, file) {
        let record        = await this.get(recordId);
        let result        = await this.attachments.save(name, file);

        let att = _.extend({}, result, {
            name:   name,
            id:     result.file
        });
        return this.updateRaw(recordId, { $push: { _attachments: att } });
    }


    /**
     * 
     * @param {String} recordId 
     * @param {String} attachmentId 
     */
    async deleteAttachment(recordId, attachmentId) {
        let record      = await this.get(recordId);

        if (!record) {
            return Q.reject(new Error(400, "Resource not found"));
        }

        let attachments = record._attachments || [];

        if (!_.find(attachments, ['id', attachmentId])) {
            return Q.resolve(record);
        }

        await this.attachments.delete(attachmentId);

        let $pull = { _attachments: { id: attachmentId } }; 
        return this.updateRaw(recordId, { $pull });
    }

    /**
     * 
     * 
     * @param {String} attachmentId 
     * @returns {Stream}
     * @memberof Resource
     */
    readAttachment(attachmentId) {
        return this.attachments.stream(attachmentId);
    }

}