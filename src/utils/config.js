const os               = require("os");
const path             = require("path");
const _                = require("lodash");
const env              = require("./env");
const mkdirp           = require("mkdirp");
const {
    stringFromFile
} = require('./helpers');

const cmsFolder     = path.join(os.homedir(),   '.pocket');
const secretFile    = path.join(cmsFolder,      `.${env()}.secret`);
const dataFolder    = path.join(cmsFolder,      `${env()}_db`);
const uploadFolder  = path.join(dataFolder,     `uploads`);
const day           = 86400;

mkdirp.sync(cmsFolder);

/**
 * Default configuration
 *
 */
module.exports = {
    session: {
        secret: stringFromFile(secretFile, () => _.now().toString(24)),
        expiresIn: day * 60
    },
    datastore: {
        adapter: "disk",
        options: {
            dataFolder,
            uploadFolder
        }
    },
    filestore: {
        adapter: "disk",
        options: {
            uploadFolder
        }
    },
    testing: {
        disableAuthentication: false
    }
};