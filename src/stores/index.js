import _                from "lodash"
import FileStore        from "./files/disk"
import DiskAdapter      from "./json/disk";
import MongoAdapter     from './json/mongo';

let adapters = {
    'disk': DiskAdapter,
    'mongo': MongoAdapter
};

export function createJsonStore(pocket) {
    const { datastore: { adapter, options } } = pocket.config();
    const Adapter = adapters[adapter]

    return new Adapter(pocket, options);
};

export function createFileStore(pocket) {
    return new FileStore(pocket.config().filestore.options)
};

export default { createJsonStore, createFileStore }