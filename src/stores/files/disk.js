const path             = require('path');
const fs               = require('fs');
const _                = require('lodash');
const Q                = require('q');
const uuid             = require('uuid/v1');
const { promisify }    = require('../../utils/helpers');
const mkdirp           = require('mkdirp');
const {
    MAGIC_MIME_TYPE,
    Magic }        = require('mmmagic');

/**
 *
 *
 * @export
 * @class DiskStore
 */
class DiskStore {

    /**
     * Creates an instance of DiskStore.
     *
     * @param {String} uploadFolder
     * @memberof DiskStore
     */
    constructor({ uploadFolder }) {
        this.uploadFolder = uploadFolder;
        if (!fs.existsSync(this.uploadFolder)) {
            mkdirp.sync(this.uploadFolder);
        }
    }

    // ---- Helpers

    _stampFilename(name) {
        return `${uuid()}-${name}`;
    }

    _isStream(stream) {
        return stream != null
            && _.isObject(stream)
            && _.isFunction(stream.pipe);
    }

    _getMetadata(file) {
        const filePath      = path.join(this.uploadFolder, file);
        const magic         = new Magic(MAGIC_MIME_TYPE);
        const getMimeType   = promisify(magic.detectFile, magic);
        const getStats      = promisify(fs.stat, fs);

        return Q.all([
            getMimeType(filePath),
            getStats(filePath)
        ])
        .then(([mimeType, { size }]) => {
            let createdAt = _.now();
            return { file, mimeType, size, createdAt };
        });
    }

    // ---- API

    /**
     * Saves the incoming stream into a file
     *
     * @param {String} filename
     * @param {Stream} istream
     * @memberof DiskStore
     */
    saveStream(filename, istream) {
        return Q.Promise((resolve, reject) => {
            let outputFilename  = this._stampFilename(filename);
            let outputFilepath  = path.join(this.uploadFolder, outputFilename);
            let ostream         = fs.createWriteStream(outputFilepath);

            istream.pipe(ostream);
            ostream.on('finish', (d) => {
                this._getMetadata(outputFilename)
                    .then(resolve)
                    .catch(reject);
            });
            istream.on('error', reject);
        });
    }

    /**
     *
     *
     * @param {String} filename
     * @param {String} filepath
     * @memberof DiskStore
     */
    saveFile(filename, filepath) {
        try {
            let istream = fs.createReadStream(filepath);
            return this.saveStream(filename, istream);
        } catch (e) {
            return Q.reject(e);
        }
    }

    /**
     *
     * @param {String} filename
     * @param {String|Stream} streamOrFile
     */
    save(filename, streamOrFile) {
        if (_.isString(streamOrFile)) {
            return this.saveFile(filename, streamOrFile);
        }
        if (this._isStream(streamOrFile)) {
            return this.saveStream(filename, streamOrFile);
        }
        return Q.reject("Bad stream or file");
    }

    /**
     *
     *
     * @param {String} filename
     * @returns {Stream}
     * @memberof DiskStore
     */
    stream(filename) {
        let filepath  = path.join(this.uploadFolder, filename);
        return fs.createReadStream(filepath);
    }

    /**
     *
     *
     * @param {any} filename
     * @memberof DiskStore
     */
    delete(filename) {
        return Q.Promise((resolve, reject) => {
            fs.unlink(path.join(this.uploadFolder, filename), (err) => {
                if (err) {
                    return reject(err)
                }
                resolve();
            });
        });
    }

    async ready() {
        return true;
    }

    async close() {
        // noop
    }
}

module.exports = DiskStore;