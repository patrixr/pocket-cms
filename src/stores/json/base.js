export class BaseAdapter {
    constructor(pocket, config) {
        this.pocket = pocket;
        this.config = config;
    }

    setUniqueField(fieldName) {
        throw 'Not Implemented'
    }

    async find (collection, query) {
        throw 'Not Implemented';
    }

    async insert (collection, payload) {
        throw 'Not Implemented';
    }

    async update (collection, query, operations, options) {
        throw 'Not Implemented';
    }

    async remove (collection, query, options) {
        throw 'Not Implemented';
    }

    async close() {
        throw 'Not Implemented'
    }

    async ready () {
        throw 'Not Implemented'
    }
}