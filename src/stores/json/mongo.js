import { BaseAdapter } from './Base'

export class MongoAdapter extends BaseAdapter {

    constructor(pocket, config) {
        super(pocket, config);
    }

    async find (query) {
        throw 'Not Implemented';
    }

    async insert (payload) {
        throw 'Not Implemented';
    }

    async update (query, operations, options) {
        throw 'Not Implemented';
    }

    async ready () {
        throw 'Not Implemented'
    }
}

export default MongoAdapter;