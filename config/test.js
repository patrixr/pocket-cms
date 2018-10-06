import path from "path"

export default {
    // ---- Database location
    "dataFolder": path.join(__dirname, "../db_test"),
    "uploadFolder": path.join(__dirname, "../db_test/uploads"),
    "testing": {
        "disableAuthentication": true
    }
}