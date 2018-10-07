import _        from "lodash"
import log4js   from "log4js"
import Q        from 'q';

const logger = log4js.getLogger();

const defaultErrorMessages = {
    400: "Bad request",
    404: "Resource not found",
    500: "Internal server error"
};

const HttpCodeMapping = {
    "ENOENT"    : 404
};

export class Error {

    /**
     * Creates a new Error object from an exception 
     * 
     * @param {*} err 
     */
    static fromException(err) {
        if (err instanceof Error) {
            return new Error(err.code, err.message);
        }

        if (err.key && err.errorType) {
            // Nedb Error
            if (err.errorType == 'uniqueViolated') {
                return new Error(409, `${err.key} is already in use`);
            }
        }

        let code = err.code;
        let message = err.message;

        if (HttpCodeMapping[code]) {
            code = HttpCodeMapping[code];
        }
        if (!_.isFinite(code)) {
            logger.error(`Unknown error : `, err);
            code = 500;
        }
        
        message = (message || defaultErrorMessages[code] || "Internal server error");
        return new Error(code, message);
    }

    constructor(code, message) {
        this.code       = code;
        this.message    = message;
    }

    send(res) {
        res.status(this.code);
        res.json({
            code: this.code,
            message: this.message
        });
    }

    promise() {
        return Q.reject(this);
    }
}

export const USERNAME_TAKEN         = new Error(409, "Username is already in use");
export const INTERNAL_ERROR         = new Error(500, "Internal server error");
export const INVALID_USERNAME_PW    = new Error(401, "Invalid username or password");
export const INVALID_USER_GROUP     = new Error(400, "Invalid user group");
export const RESOURCE_NOT_FOUND     = new Error(404, "Resource not found");
export const FORBIDDEN              = new Error(403, "Forbidden");
export const UNAUTHORIZED           = new Error(401, "Unauthorized");
export const SESSION_EXPIRED        = new Error(401, "Session Expired");
export const MISSING_FILE           = new Error(400, "Missing file");