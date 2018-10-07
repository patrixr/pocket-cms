import _    from "lodash"
import Q    from "q"
import fs   from "fs";

export function promisify(method, scope) {
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

export function isNumeric (x) {
    return ((typeof x === 'number' || typeof x === 'string') && !isNaN(Number(x)));
}

export async function asyncEach(list, func) {
    for (let i = 0; i < list.length; ++i) {
        await func(list[i]);
    }
}

export function stringFromFile(file, defaultValue) {
    if (fs.existsSync(file)) {
        return fs.readFileSync(file).toString();
    }

    if (_.isFunction(defaultValue)) {
        defaultValue = defaultValue();
    }

    fs.writeFileSync(file, defaultValue);
    return defaultValue;
}