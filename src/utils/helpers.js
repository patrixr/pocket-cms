const  _    = require("lodash");
const  Q    = require("q");
const  fs   = require("fs");

/**
 * Transforms a node-style callback method into a pronise returning function
 * 
 * Expects the call back to receive the error as the first argument, and the result as the second
 * 
 * @param {function} method 
 * @param {*} scope 
 */
function promisify(method, scope) {
    return function (...args) {
        let deferred = Q.defer();

        args.push(function cb(err, result) {
            return err ?
                deferred.reject(err) :
                deferred.resolve(result);
        });

        method.apply(scope || null, args);

        return deferred.promise;
    }
}

/**
 * Returns true if x is either a number, or a string of digits
 *
 * @export
 * @param {*} x
 * @returns
 */
function isNumeric (x) {
    return ((typeof x === 'number' || typeof x === 'string') && !isNaN(Number(x)));
}

/**
 * Asynchronous forEach that can be awaited
 *
 * @export
 * @param {*} list
 * @param {function} func
 */
async function asyncEach(list, func) {
    for (let i = 0; i < list.length; ++i) {
        await func(list[i]);
    }
}

/**
 * Returns the file content as string, creates it if it doesn't exist with the value specified
 * 
 * @param {string} file 
 * @param {string|function} defaultValue 
 */
function stringFromFile(file, defaultValue) {
    if (fs.existsSync(file)) {
        return fs.readFileSync(file).toString();
    }

    if (_.isFunction(defaultValue)) {
        defaultValue = defaultValue();
    }

    fs.writeFileSync(file, defaultValue);
    return defaultValue;
}

/**
 * Returns true if node is running in Travis
 *
 * @export
 * @returns {boolean}
 */
function isCI() {
    return 'TRAVIS' in process.env;
}

module.exports = {
    promisify,
    isNumeric,
    asyncEach,
    stringFromFile,
    isCI
};