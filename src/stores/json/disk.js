const  path             = require('path');
const  Q                = require('q');
const  _                = require('lodash');
const  nedb             = require("nedb");
const  Cache            = require("../../utils/cache");
const  BaseAdapter      = require('./base');
const  { promisify }    = require("../../utils/helpers");

class DiskAdapter extends BaseAdapter {

    constructor(pocket, config) {
        super(pocket, config);
        this.cache = new Cache();
    }

    _filepath(name) {
        return path.join(this.config.dataFolder, name + ".db")
    }

    _getDB(name) {
        return this.cache.resolve(name, () => new nedb({ filename: this._filepath(name), autoload: true }));
    }

    /**
     * Make specified field unique
     *
     * @param {string} collection
     * @param {string} fieldName
     * @memberof BaseAdapter
     */
    setUniqueField(collection, fieldName) {
        const db = this._getDB(collection);
        db.ensureIndex({ fieldName, unique: true }, (err) => {
            if (err) {
                logger.error(err)
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
    async find (collection, query, opts) {
        let db          = this._getDB(collection);
        let transaction = db.find(query);

        if (_.isNumber(opts.skip)) {
            transaction = transaction.skip(opts.skip);
        }
        if (_.isNumber(opts.limit)) {
            transaction = transaction.limit(opts.limit);
        }

        let exec = promisify(transaction.exec, transaction);
        return exec();
    }

    /**
     * Inserts a record into the collection
     * 
     * @param {string} collection 
     * @param {object} payload 
     */
    async insert (collection, payload) {
        let db      = this._getDB(collection);
        let insert  = promisify(db.insert, db);

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
    async update (collection, query, operations, opts = {}) {
        let db          = this._getDB(collection);
        let deferred    = Q.defer();

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
     * Remove one or multiple records
     * 
     * @param {string} collection 
     * @param {object} query 
     * @param {object} options 
     * @param {object} options.multi
     */
    async remove (collection, query, options = { multi: true }) {
        let db      = this._getDB(collection);
        let remove  = promisify(db.remove, db);

        return await remove(query, options);
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
    async ready () {
        return true;
    }
}

module.exports = DiskAdapter;