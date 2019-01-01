const _       = require("lodash");
const uniqid  = require('uniqid');
const modify  = require("modifyjs");
const env   = require("./utils/env");
const { 
  RESOURCE_NOT_FOUND,
  Error
} = require("./utils/errors");

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
class Resource {
  constructor(name, schema, pocket, context = {}) {
    this.name = name;
    this.schema = schema;
    this.context = context;
    this.pocket = pocket;
    this.config = pocket.config();

    // ---- Stores
    this.store = pocket.jsonStore;
    this.attachments = pocket.fileStore;

    // ---- Unique Fields
    this.store.ready().then(() => {
      _.each(this.getIndices(), ({ field, unique }) => {
        this.store.setIndex(this.name, field, { unique: !!unique });
      });
    });
  }

  // ---- Helpers

  getIndices() {
    return this.schema ? this.schema.indices() : [];
  }

  async compute(records) {
    if (!this.schema) {
      return records;
    }
    if (!_.isArray(records)) {
      records = [ records ];
    }
    return Promise.all(
      _.map(records, r => this.schema.compute(r))
    );
  }

  async validate(payload, opts = {}) {
    let { isUpdate = false } = opts;

    // We don't try to validate internal properties
    let privateProps = _.pick(payload, reservedProperties);
    let stripped = _.omit(payload, reservedProperties);

    if (this.schema == null) {
      return stripped;
    }

    await this.runHooks({ record: stripped, schema: this.schema }).before(
      "validate"
    );

    const { errors, data } = await this.schema.validate(stripped, {
      ignoreRequired: isUpdate
    });

    _.extend(data, privateProps);

    await this.runHooks({ record: data, schema: this.schema, errors }).after(
      "validate"
    );

    if (errors.length > 0) {
      throw new Error(400, errors.join("\n"));
    }

    return data;
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
    _.keys(this.hooks, key => {
      _.each(this.hooks[key], (handlers, method) => {
        clone.hooks[key][method] = handlers.map(_.identity);
      });
    });
    return clone;
  }

  // ---- Methods

  /**
   * Returns a record = require(it's ID);
   *
   * @param {*} id
   * @returns
   * @memberof Resource
   */
  get(id, opts) {
    return this.findOne({ _id: id }, opts);
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
    await this.store.ready();

    let records = await this.find(
      query,
      _.extend({}, options, { pageSize: 1 })
    );
    return records[0] || null;
  }

  findAll(opts = {}) {
    return this.find({}, opts);
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
    await this.store.ready();

    await this.runHooks({ query, options: opts }).before("find", "read");

    let params = {};
    let paginated = false;
    let page = _.isNumber(opts.page) ? opts.page : 1;
    let pageSize = opts.pageSize;
    if (_.isNumber(pageSize)) {
      paginated = true;
      let idx = page > 0 ? page - 1 : 0; // Pages are 1 indexed
      params.skip = idx * pageSize;
      params.limit = pageSize;
    }

    let records = await this.store.find(this.name, query, params);

    if (paginated) {
      const count = await this.store.count(this.name, query);
      records.meta = {
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize)
      };
    }

    if (!opts.skipComputation) {
      await this.compute(records);
    }

    await this.runHooks({ records, query, options: opts }).after(
      "find",
      "read"
    );

    return records;
  }

  /**
   * Creates a record = require(the payload);
   *
   * @param {*} payload
   * @param {*} [opts={}]
   * @returns
   * @memberof Resource
   */
  async create(payload, opts = {}) {
    await this.store.ready();

    let userId = opts.userId || (this.context.user && this.context.user.id);
    let data = opts.skipValidation ? payload : await this.validate(payload);

    await this.runHooks({ record: data }).before("create", "save");

    data._id = uniqid();
    data._createdAt = Date.now();
    data._updatedAt = data._createdAt;
    data._attachments = [];
    data._createdBy = userId || null;

    let record = await this.store.insert(this.name, data);

    if (!opts.skipComputation) {
      await this.compute(record);
    }

    await this.runHooks({ record }).after("create", "save");

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
    await this.store.ready();

    const opts = _.extend({ multi: true }, options);

    await this.runHooks({ query, operations }).before("update");

    await this.store.each(this.name, query, opts).do(async record => {
      const updatedRecord = modify(record, operations);
      updatedRecord._updatedAt = Date.now();
      await this.runHooks({ oldRecord: record, record: updatedRecord }).before("save");
      await this.store.update(
        this.name,
        { _id: record._id },
        { $set: updatedRecord }
      );
      await this.runHooks({ record: updatedRecord, query, operations }).after("update", "save");
      return updatedRecord;
    });
  }

  /**
   * Upsert multiple records
   *
   * @param {*} query
   * @param {*} payload
   * @returns
   * @memberof Resource
   */
  async upsert(query, payload, options = {}) {
    await this.store.ready();

    const exists = await this.findOne(query);
    if (exists) {
      await this.update(query, { $set: payload }, options);
    }
    await this.create(payload, options);
  }

  /**
   * Upsert multiple records
   *
   * @param {*} query
   * @param {*} payload
   * @returns
   * @memberof Resource
   */
  async upsertOne(query, payload, options = {}) {
    await this.store.ready();

    const record = await this.findOne(query);
    if (record) {
      return this.updateOne(record._id, { $set: payload });
    }
    return this.create(payload, options);
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
    const exists = await this.get(id);

    if (!exists) {
      throw RESOURCE_NOT_FOUND;
    }

    await this.update({ _id: id }, operations, { multi: false });
    return this.get(id);
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
    await this.store.ready();

    const multi = !!options.multi;

    await this.runHooks({ query, options }).before("remove");

    let removedCount = await this.store.remove(this.name, query, { multi });

    await this.runHooks({ query, options, removedCount }).after("remove");

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
      throw "Dropping a database is only allowed in test mode";
    }

    await this.store.ready();

    return this.store.remove(this.name, {}, { multi: true });
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
    await this.store.ready();
    await this.attachments.ready();

    let result = await this.attachments.save(name, file);

    let att = _.extend({}, result, {
      name: name,
      id: result.file
    });

    return this.updateOne(recordId, { $push: { _attachments: att } });
  }

  /**
   *
   * @param {String} recordId
   * @param {String} attachmentId
   */
  async deleteAttachment(recordId, attachmentId) {
    await this.store.ready();
    await this.attachments.ready();

    let record = await this.get(recordId);

    if (!record) {
      throw new Error(400, "Resource not found");
    }

    let attachments = record._attachments || [];

    if (!_.find(attachments, ["id", attachmentId])) {
      return record;
    }

    await this.attachments.delete(attachmentId);

    record._attachments = record._attachments.filter(
      att => att.id !== attachmentId
    );
    return this.mergeOne(recordId, record, { skipValidation: true });
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

  runHooks(data) {
    return this.schema.runHooks(data, this.context);
  }
}

module.exports = Resource;
