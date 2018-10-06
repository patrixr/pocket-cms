import _        from "lodash"
import path     from "path"
import env      from "./env"

const config    = require(`./${env()}`).default;
const day       = 86400;

export default _.extend({
    // ---- Database location
    "dataFolder":   path.join(__dirname, "../db"),
    "uploadFolder": path.join(__dirname, "../db/uploads"),

    "testing": {
        "disableAuthentication": false
    },

    "session": {
        "expiresIn": day * 60
    }

}, config);