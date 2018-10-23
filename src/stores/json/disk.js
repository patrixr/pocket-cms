import path             from 'path'
import Q                from 'q'
import _                from 'lodash'
import nedb             from "nedb"
import Cache            from "../../utils/cache"
import { BaseAdapter }  from './Base'
import { promisify }    from "../../utils/helpers"

export class DiskAdapter extends BaseAdapter {

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

    setUniqueField(collection, fieldName) {
        const db = this._getDB(collection);
        db.ensureIndex({ fieldName, unique: true }, (err) => {
            if (err) {
                logger.error(err)
            }
        });
    }

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

    async insert (collection, payload) {
        let db      = this._getDB(collection);
        let insert  = promisify(db.insert, db);

        return insert(payload);
    }

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

    async remove (collection, query, options = { multi: true }) {
        let db      = this._getDB(collection);
        let remove  = promisify(db.remove, db);

        return await remove(query, options);
    }

    async close() {
        return true;
    }

    async ready () {
        return true;
    }
}

export default DiskAdapter;