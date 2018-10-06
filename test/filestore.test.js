import config           from "../config";
import fs               from "fs"
import path             from "path"
import rimraf           from "rimraf"
import _                from "lodash"
import Q                from "q"
import { expect }       from "chai"
import {LocalFileStore} from '../src/stores/files/LocalFileStore';

describe("Filestore", () => {

    let filestore = null;

    function assertIsStream(stream) {
        expect(stream).not.to.be.null;
        expect(stream).to.be.an('object');
        expect(stream.pipe).to.be.a('function');
    }

    function testFile(name) {
        return path.join(__dirname, 'samples', name);
    }

    const assertUploadExists = (f) => {
        const uri = path.join(config.uploadFolder, f);
        expect(fs.existsSync(uri)).to.be.true;
    };


    beforeEach((done) => {
        filestore = new LocalFileStore(config.uploadFolder);
        done();
    })

    afterEach((done) => {
        rimraf(config.uploadFolder, done);
    })

    it("Should save a file to disk", (done) => {
        filestore.saveFile('image1', testFile('sample_image.png'))
            .then((result) => {
                expect(result).to.be.an('object');
                expect(result.mimeType).to.equal('image/png');
                expect(result.size).to.be.above(70000);
                expect(result.file).to.be.a('string');
                expect(result.createdAt).to.be.a('number');
                assertUploadExists(result.file);
            })
            .should.be.fulfilled
            .notify(done)
    })

    it("Should reject saving a bad file", (done) => {
        filestore.saveFile('image1', './i.dont.exist')
            .should.be.rejected
            .notify(done)
    })

    it("Should read a file from disk", (done) => {
        filestore.saveFile('image1', testFile('sample_image.png'))
            .then((result) => {
                let filename = result.file;
                let deferred = Q.defer();
                let istream = filestore.stream(filename);
                assertIsStream(istream);

                istream.on('data', _.noop);
                istream.on('error', (e) => deferred.reject(e));
                istream.on('end', () => deferred.resolve());

                return deferred.promise;
            })
            .should.be.fulfilled
            .notify(done);
    })

    it("Should delete a file from disk", (done) => {
        filestore.saveFile('image1', testFile('sample_image.png'))
            .then((result) => {
                let filename = result.file;
                assertUploadExists(filename);
                return filestore.delete(filename)
                    .then(() => filename);
            })
            .then((filename) => {
                expect(fs.existsSync(path.join(config.uploadFolder, filename))).to.be.false;
            })
            .should.be.fulfilled
            .notify(done);
    });

})