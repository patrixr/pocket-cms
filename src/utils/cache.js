class Cache {

    constructor() {
        this.data = {};
    }

    /**
     * If key exists in the cache, returns the value. Otherwise initializes it with the setter function 
     *
     * @param {*} key
     * @param {*} defaultFn
     * @returns
     * @memberof Cache
     */
    resolve(key, setterFn) {
        if (!this.data[key] && setterFn) {
            this.data[key] = setterFn();
        }
        return this.data[key];
    }

    /**
     * Wraps the function, allowing only the first call to go through. Any subsequent call will use the cached result
     *
     * @static
     * @param {*} func
     * @returns
     * @memberof Cache
     */
    static once(func) {
        let result = null;
        let called = false;
        return (...args) => {
            if (!called) {
                result = func(...args);
                called = true;
            }
            return result;
        }
    }
}

module.exports = Cache;