import stores           from "./stores"
import path             from "path"
import config           from "../config"
import env              from "../config/env"
import Q                from "q"
import _                from "lodash"
import log4js           from "log4js"
import { promisify , asyncEach}    from "./utils/helpers"
import { Error }        from "./utils/errors"
import { Validator }    from "jsonschema"

const logger = log4js.getLogger();
const reservedProperties = [ 
    "_id",
    "_userId",
    "_createdAt", 
    "_updatedAt",
    "_attachments"
];

const allHooks = {};

/**
 * CMS resource. Used to interact with the database
 *
 * @export
 * @class Resource
 */
export class Resource {

    constructor(name, schema, context = {}) {
        this.name = name;
        this.schema = schema;
        this.context = context;

        // ---- Stores
        this.filename       = path.join(config.dataFolder, name + ".db");
        this.store          = stores.getStore(name, this.getUniqueKeys());
        this.attachments    = stores.getFileStore();
        this.hooks          = allHooks[name] || {
            before: {},
            after: {}
        };

        allHooks[name] = this.hooks;
    }

    // ---- Helpers

    getUniqueKeys() {
        return _.map(this.schema.properties, (desc, name) => desc.unique ? name : null).filter(_.identity);
    }

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

    // ---- Context

    /**
     * Creates a copy of the resource augmented with a context.
     * Contexts are passed to before and after hooks
     *
     * @param {*} ctx
     * @returns
     * @memberof Resource
     */
    withContext(ctx) {
        return new Resource(this.name, this.schema, this.context);
    }

    // ---- Methods

    /**
     * Returns a record from it's ID
     *
     * @param {*} id
     * @returns
     * @memberof Resource
     */
    get(id) {
        return this.findOne({ _id: id });
    }

    /**
     * Returns a single record matching the query
     *
     * @param {*} [query={}]
     * @param {*} [options={}]
     * @returns
     * @memberof Resource
     */
    async findOne(query = {}, options = {}) {
        let records = await this.find(query, _.extend({}, options,{ pageSize: 1 }));
        return records[0] || null;
    }

    /**
     * Returns a list of records marching the query
     *
     * @param {*} [query={}]
     * @param {*} [opts={}]
     * @returns
     * @memberof Resource
     */
    async find(query = {}, opts = {}) {
        await this.runHooks({ query, options : opts }).before('find');

        let transaction = this.store.find(query);

        if (_.isNumber(opts.pageSize)) {
            if (_.isNumber(opts.page)) {
                let page = opts.page > 0 ? opts.page - 1 : 0; // Pages are 1 indexed
                transaction = transaction.skip(page * opts.pageSize);
            }
            transaction = transaction.limit(opts.pageSize);
        }

        let exec = promisify(transaction.exec, transaction);
        let records = await exec();
        
        await this.runHooks({ records, query, options : opts }).after('find');
         
        return records;
    }

    /**
     * Creates a record from the payload
     *
     * @param {*} payload
     * @param {*} [opts={}]
     * @returns
     * @memberof Resource
     */
    create(payload, opts = {}) {
        const { userId = null } = opts;
        return this.validate(payload)
            .then(async (data) => {
               await this.runHooks({ payload: data }).before('create');
               await this.runHooks({ payload: data }).before('save');
               return data;
            })
            .then((data) => {
                let insert = promisify(this.store.insert, this.store);
                data._createdAt = Date.now();
                data._updatedAt = Date.now();
                data._attachments = [];
                data._userId = userId;
                return insert(data);
            })
            .then(async (record) => {
                await this.runHooks({ record }).after('create');
                await this.runHooks({ record }).after('save');
                return record;
            })
    }

    /**
     * Upddates the record specified by the ID by merging in the payload passed as argument
     *
     * @param {*} id
     * @param {*} payload
     * @param {*} [opts={}]
     * @returns
     * @memberof Resource
     */
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

    /**
     * Updates the record specified by the ID with the mongo operations
     *
     * @param {*} id
     * @param {*} operations
     * @returns
     * @memberof Resource
     */
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
    
    /**
     * Deletes a record by it's ID
     *
     * @param {*} id
     * @returns
     * @memberof Resource
     */
    remove(id) {
        let remove = promisify(this.store.remove, this.store);
        return remove({ _id: id }, {});
    }

    /**
     * Dros the entire collection. Only available in test mode
     *
     * @returns
     * @memberof Resource
     */
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

    // ---- HOOKS

    before(method, fn) {
        if (!this.hooks.before[method]) {
            this.hooks.before[method] = [];
        }
        this.hooks.before[method].push(fn);
    }

    after(method, fn) {
        if (!this.hooks.after[method]) {
            this.hooks.after[method] = [];
        }
        this.hooks.after[method].push(fn);
    }

    runHooks(data) {
        const run = async (hooks) => {
            await asyncEach(hooks, async (hook) => {
                await hook(data, this.context);
            });  
        };
        return {
            after: async (method) => {
                await run(this.hooks.after[method] || []); 
            },
            before: async (method) => {
                await run(this.hooks.before[method] || []); 
            }
        };
    }

}