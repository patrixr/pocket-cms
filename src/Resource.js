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
        //@TODO remove filename, currently used in tests
        this.filename       = path.join(config.dataFolder, name + ".db");
        this.store          = stores.getStore(name, this.getUniqueKeys());
        this.attachments    = stores.getFileStore();
        this.hooks          = {
            before: {},
            after: {}
        };
    }

    // ---- Helpers

    getUniqueKeys() {
        return _.map(this.schema.properties, (desc, name) => desc.unique ? name : null).filter(_.identity);
    }

    async validate(data, opts = {}) {
        let { isUpdate = false } = opts;

        // We don't try to validate internal properties
        let stripped = _.omit(data, reservedProperties);

        if (this.schema == null) {
            return stripped
        }

        await this.runHooks({ record: stripped, schema : this.schema }).before('validate');

        // We remove the required fields in order to support partial updates
        let schema      = isUpdate ? _.omit(this.schema, 'required') : this.schema;
        let { errors }  = new Validator().validate(stripped, schema);

        await this.runHooks({ record: stripped, schema : this.schema, errors }).after('validate');

        if (errors.length > 0) {
            let msg = errors.map((e) => e.property + " " + e.message).join("\n");
            throw new Error(400, msg);
        }

        return stripped;
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
        let clone = new Resource(this.name, this.schema, ctx);
        _.keys(this.hooks, (key) => {
            _.each(this.hooks[key], (handlers, method) => {
                clone.hooks[key][method] = handlers.map(_.identity);
            });
        })
        return clone;
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
               await this.runHooks({ payload: data }).before('create', 'save');
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
                await this.runHooks({ record }).after('create', 'save');
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
    mergeOne(id, payload, opts = {}) {
        let { skipValidation } = opts;
 
        let validate = skipValidation ?
            Q.resolve(payload)
            : this.validate(payload, { isUpdate: true });

        return validate
            .then((data) => {
                return this.updateOne(id, { $set: data });
            });
    }

    /**
     * Update multiple records
     *
     * @param {*} query
     * @param {*} operations
     * @returns
     * @memberof Resource
     */
    async update(query, operations, opts = {}) {
        let deferred = Q.defer();
        let multi    = !!opts.multi;

        await this.runHooks({ query, operations }).before('update', 'save');

        this.store.update(query, operations, { returnUpdatedDocs: true, multi }, async (err, count, result) => {
            if (err) {
                deferred.reject(err);
            } else {
                const records = _.isArray(result) ? result : [result];
                await this.runHooks({ query, operations, records }).after('update', 'save');
                deferred.resolve(result);
            }
        });

        return deferred.promise;
    }

    /**
     * Updates the record specified by the ID with the mongo operations
     *
     * @param {*} id
     * @param {*} operations
     * @returns
     * @memberof Resource
     */
    async updateOne(id, operations) {
        return this.update({ _id: id }, operations, { multi: false });
    }
    
    /**
     * Deletes a record by it's ID
     *
     * @param {*} id
     * @returns
     * @memberof Resource
     */
    removeOne(id) {
        return this.remove({ _id: id }, { multi: false });
    }

    /**
     * Delete records by query
     *
     * @param {*} id
     * @returns
     * @memberof Resource
     */
    async remove(query, options = { multi: true }) {
        const multi = !!options.multi;
        const remove = promisify(this.store.remove, this.store);

        await this.runHooks({ query, options }).before('remove');

        let removedCount = await remove(query, { multi });

        await this.runHooks({ query, options, removedCount }).after('remove');

        return removedCount;
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
        return this.updateOne(recordId, { $push: { _attachments: att } });
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
        return this.updateOne(recordId, { $pull });
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

}