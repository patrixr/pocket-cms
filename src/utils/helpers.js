import Q from "q"

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