const path = require("path");
const Q = require("q");
const _ = require("lodash");
const nedb = require("nedb");
const Cache = require("../../utils/cache");
const BaseAdapter = require("./base");
const { promisify } = require("../../utils/helpers");

class DiskAdapter extends BaseAdapter {
  constructor(pocket, config) {
    super(pocket, config);
    this.cache = new Cache();
  }

  _filepath(name) {
    return path.join(this.config.dataFolder, name + ".db");
  }

  _getDB(name) {
    return this.cache.resolve(
      name,
      () => new nedb({ filename: this._filepath(name), autoload: true })
    );
  }

  /**
   * Make specified field an index
   *
   * @param {string} collection
   * @param {string} fieldName
   * @param {object} options
   * @memberof BaseAdapter
   */
  setIndex(collection, fieldName, opts = { unique: false }) {
    const db = this._getDB(collection);
    const unique = !!opts.unique;
    db.ensureIndex({ fieldName, unique }, err => {
      if (err) {
        logger.error(err);
      }
    });
  }

  /**
   * Finds items based on the query
   *
   * @param {string} collection
   * @param {object} query
   * @param {object} opts
   * @param {number} opts.skip
   * @param {number} opts.limit
   * @returns
   * @memberof DiskAdapter
   */
  find(collection, query, opts) {
    let db = this._getDB(collection);
    let transaction = db.find(query);

    if (_.isNumber(opts.skip)) {
      transaction = transaction.skip(opts.skip);
    }
    if (_.isNumber(opts.limit)) {
      transaction = transaction.limit(opts.limit);
    }

    return promisify(transaction.exec, transaction)();
  }

  /**
   * Iterate over records
   *
   * @param {*} collection
   * @param {*} query
   * @param {*} opts
   * @returns
   * @memberof MongoAdapter
   */
  each(collection, query, opts) {
    return {
      do: async fn => {
        const items = await this.find(collection, query, {
          ...opts,
          cursor: true
        });
        for (let i = 0; i < items.length; ++i) {
          await fn(items[i]);
        }
      }
    };
  }

  /**
   * Inserts a record into the collection
   *
   * @param {string} collection
   * @param {object} payload
   */
  insert(collection, payload) {
    let db = this._getDB(collection);
    let insert = promisify(db.insert, db);

    return insert(payload);
  }

  /**
   * Updates records specified by the query
   *
   * @param {string} collection
   * @param {object} query
   * @param {object} operations
   * @param {object} opts
   * @param {boolean} opts.multi
   */
  update(collection, query, operations, opts = {}) {
    let db = this._getDB(collection);
    let deferred = Q.defer();

    const options = _.extend({ returnUpdatedDocs: true, multi: true }, opts);

    db.update(query, operations, options, (err, count, result) => {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(result);
      }
    });

    return deferred.promise;
  }

  /**
   * Create or update a record
   *
   * @param {string} collection
   * @param {object} query
   * @param {object} operations
   * @param {object} opts
   * @param {boolean} opts.multi
   */
  upsert(collection, query, operations, opts = {}) {
    let db = this._getDB(collection);
    let deferred = Q.defer();

    const options = _.extend({ returnUpdatedDocs: true, multi: true }, opts);

    db.upsert(query, operations, options, (err, count, result) => {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(result);
      }
    });

    return deferred.promise;
  }

  /**
   * Remove one or multiple records
   *
   * @param {string} collection
   * @param {object} query
   * @param {object} options
   * @param {object} options.multi
   */
  remove(collection, query, options = { multi: true }) {
    let db = this._getDB(collection);
    let remove = promisify(db.remove, db);

    return remove(query, options);
  }

  /**
   * Returns the number or records
   *
   * @param {string} collection
   * @param {object} query
   * @memberof BaseAdapter
   */
  count(collection, query = {}) {
    let db = this._getDB(collection);
    let count = promisify(db.count, db);

    return count(query);
  }

  /**
   * Closes the connection
   */
  async close() {
    return true;
  }

  /**
   * Resolves once the adapter has been initialized
   */
  async ready() {
    return true;
  }
}

module.exports = DiskAdapter;
