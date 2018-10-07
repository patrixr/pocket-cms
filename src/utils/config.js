import os               from "os"
import path             from "path"
import _                from "lodash"
import env              from "./env"
import mkdirp           from "mkdirp"
import { 
    stringFromFile 
} from './helpers';

const cmsFolder     = path.join(os.homedir(),   '.humble');
const secretFile    = path.join(cmsFolder,      `.${env()}.secret`);
const dataFolder    = path.join(cmsFolder,      `${env()}_db`);
const uploadFolder  = path.join(dataFolder,     `uploads`);
const day           = 86400;

mkdirp.sync(cmsFolder);

/**  
 * Default configuration
 *  
 */
export default {
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