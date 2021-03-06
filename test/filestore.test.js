const config           = require("../src/utils/config");
const fs               = require("fs");
const path             = require("path");
const rimraf           = require("rimraf");
const _                = require("lodash");
const Q                = require("q");
const { expect }       = require("chai");
const DiskStore        = require("../src/stores/files/disk");

const uploadFolder = config.filestore.options.uploadFolder;

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
        const uri = path.join(uploadFolder, f);
        expect(fs.existsSync(uri)).to.be.true;
    };


    beforeEach((done) => {
        filestore = new DiskStore({ uploadFolder });
        done();
    })

    afterEach((done) => {
        rimraf.sync(uploadFolder);
        done();
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

    it("Should reject saving a bad file", async () => {
        let rejected = false;
        try {
            await filestore.saveFile('image1', './i.dont.exist')
        } catch (e) {
            rejected = true;
        }
        expect(rejected).to.be.true;
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
                expect(fs.existsSync(path.join(uploadFolder, filename))).to.be.false;
            })
            .should.be.fulfilled
            .notify(done);
    });

})