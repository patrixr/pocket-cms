const  _                = require("lodash");
const  FileStore        = require("./files/disk");
const  DiskAdapter      = require("./json/disk");
const  MongoAdapter     = require('./json/mongo');

const adapters = {
    'disk': DiskAdapter,
    'mongo': MongoAdapter
};

function createJsonStore(pocket) {
    const { datastore: { adapter, options } } = pocket.config();
    const Adapter = adapters[adapter]

    return new Adapter(pocket, options);
};

function createFileStore(pocket) {
    return new FileStore(pocket.config().filestore.options)
};

module.exports = { createJsonStore, createFileStore }