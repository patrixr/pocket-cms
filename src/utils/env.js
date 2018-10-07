let env = process.env.NODE_ENV || "dev";

/**
 * Sets the environment if provided, and returns it
 *
 * @export
 * @param {*} [newEnv=null]
 * @returns {String} the environment name
 */
export default function(newEnv = null) {
    if (newEnv) {
        env = newEnv;
    }
    return env;
} 