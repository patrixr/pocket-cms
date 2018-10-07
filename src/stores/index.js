import _                from "lodash"
import Datastore        from "nedb"
import path             from "path"
import log4js           from "log4js"
import {LocalFileStore} from "./files/LocalFileStore"
import config           from "../utils/config"

let logger = log4js.getLogger();
let stores = {};
let fileStore = null;

/**
 * Gets or creates a file store for the named resource
 *
 * @export
 * @param {*} name
 * @returns
 */
export function getStore(name, uniqueKeys = []) {
    if (!stores[name]) {
        const filename       = path.join(config.datastore.options.dataFolder, name + ".db");
        const store          = new Datastore({ filename:  filename, autoload: true  });

        _.each(uniqueKeys, (fieldName) => { 
            store.ensureIndex({ fieldName, unique: true }, (err) => {
                if (err) {
                    logger.error(err)
                }
            });
        });

        stores[name] = store;
    }
    return stores[name];
}

/**
 * Returns the configured filestore
 */
export function getFileStore() {
    if (!fileStore) {
        fileStore = new LocalFileStore(config.filestore.options.uploadFolder);
    }
    return fileStore;
}

export default { getStore, getFileStore };