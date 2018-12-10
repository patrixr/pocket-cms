class BaseAdapter {
    constructor(pocket, config) {
        this.pocket = pocket;
        this.config = config;
    }

    /**
     * Make specified field an index
     *
     * @param {string} collection
     * @param {string} fieldName
     * @memberof BaseAdapter
     */
    setIndex(collection, fieldName, opts = { unique: false }) {
        throw 'Not Implemented'
    }

    /**
     *
     *
     * @param {*} collection
     * @param {*} query
     * @param {*} opts
     * @memberof BaseAdapter
     */
    each(collection, query, opts) {
        throw 'Not Implemented';
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
        throw 'Not Implemented';
    }

    /**
     * Inserts a record into the collection
     *
     * @param {string} collection
     * @param {object} payload
     */
    async insert (collection, payload) {
        throw 'Not Implemented';
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
    async update (collection, query, operations, opts) {
        throw 'Not Implemented';
    }

    /**
     * Remove one or multiple records
     *
     * @param {string} collection
     * @param {object} query
     * @param {object} options
     * @param {object} options.multi
     */
    async remove (collection, query, options) {
        throw 'Not Implemented';
    }

    /**
     * Closes the connection
     */
    async close() {
        throw 'Not Implemented'
    }

    /**
     * Resolves once the adapter has been initialized
     *
     * @memberof BaseAdapter
     */
    async ready () {
        throw 'Not Implemented'
    }
}

module.exports = BaseAdapter;