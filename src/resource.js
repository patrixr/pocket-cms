import env              from "./utils/env"
import _                from "lodash"
import { asyncEach }    from "./utils/helpers"
import { Error }        from "./utils/errors"
import { Validator }    from "jsonschema"

const reservedProperties = [ 
    "_id",
    "_createdBy",
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

    constructor(name, schema, pocket, context = {}) {
        this.name       = name;
        this.schema     = schema;
        this.context    = context;
        this.pocket     = pocket;
        this.config     = pocket.config();

        // ---- Stores
        this.store          = pocket.jsonStore;
        this.attachments    = pocket.fileStore;

        // ---- Unique Fields
        this.store.ready().then(() => {
            _.each(this.getUniqueKeys(), (key) => {
                this.store.setUniqueField(name, key);
            })
        });
    }

    // ---- Helpers

    getUniqueKeys() {
        return this.schema ? this.schema.uniqueKeys() : [];
    }

    async validate(data, opts = {}) {
        let { isUpdate = false } = opts;

        // We don't try to validate internal properties
        let stripped = _.omit(data, reservedProperties);

        if (this.schema == null) {
            return stripped
        }

        await this.runHooks({ record: stripped, schema : this.schema }).before('validate');

        const errors = this.schema.validate(stripped, {
            ignoreRequired: isUpdate
        });

        await this.runHooks({ record: stripped, schema : this.schema, errors }).after('validate');

        if (errors.length > 0) {
            throw new Error(400, errors.join('\n'));
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
        let clone = new Resource(this.name, this.schema, this.pocket, ctx);
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
        await this.pocket.ready();

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
        await this.pocket.ready();

        await this.runHooks({ query, options : opts }).before('find');

        let params = {};
        if (_.isNumber(opts.pageSize)) {
            if (_.isNumber(opts.page)) {
                let page = opts.page > 0 ? opts.page - 1 : 0; // Pages are 1 indexed
                params.skip = page * opts.pageSize;
            }
            params.limit = opts.pageSize;
        }

        let records = await this.store.find(this.name, query, params)
        
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
    async create(payload, opts = {}) {
        await this.pocket.ready();

        let userId  = opts.userId || (this.context.user && this.context.user.id);
        let data    = await this.validate(payload);

        await this.runHooks({ payload: data }).before('create', 'save');

        data._createdAt = Date.now();
        data._updatedAt = data._createdAt 
        data._attachments = [];
        data._createdBy = userId || null;

        const record = await this.store.insert(this.name, data);

        await this.runHooks({ record }).after('create', 'save');

        return record;
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
    async mergeOne(id, payload, opts = {}) {
        let { skipValidation } = opts;
        let data = payload;

        if (!skipValidation) {
            data = await this.validate(payload, { isUpdate: true });
        }

        return this.updateOne(id, { $set: data });
    }

    /**
     * Update multiple records
     *
     * @param {*} query
     * @param {*} operations
     * @returns
     * @memberof Resource
     */
    async update(query, operations, options = {}) {
        await this.pocket.ready();

        const opts = _.extend({ returnUpdatedDocs : true, multi: true }, options);

        await this.runHooks({ query, operations }).before('update', 'save');

        const result    = await this.store.update(this.name, query, operations, opts);
        const records   = _.isArray(result) ? result : [result];
        await this.runHooks({ query, operations, records }).after('update', 'save');

        return result;
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
        await this.pocket.ready();

        const multi = !!options.multi;

        await this.runHooks({ query, options }).before('remove');

        let removedCount = await this.store.remove(this.name, query, { multi });

        await this.runHooks({ query, options, removedCount }).after('remove');

        return removedCount;
    }

    /**
     * Dros the entire collection. Only available in test mode
     *
     * @returns
     * @memberof Resource
     */
    async drop() {
        if (env() !== "test") {
            throw "Dropping a database is only allowed in test mode"
        }

        await this.pocket.ready();

        return await this.store.remove(this.name, { }, { multi: true });
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
        await this.pocket.ready();

        let result = await this.attachments.save(name, file);
        
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
        await this.pocket.ready();

        let record      = await this.get(recordId);

        if (!record) {
            throw new Error(400, "Resource not found");
        }

        let attachments = record._attachments || [];

        if (!_.find(attachments, ['id', attachmentId])) {
            return record;
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
        return this.schema.runHooks(data, this.context);
    }
}