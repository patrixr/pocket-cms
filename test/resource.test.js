import { Resource }     from "../src/Resource";
import config           from "../config";
import fs               from "fs"
import path             from "path"
import rimraf           from "rimraf"
import _                from "lodash"
import { expect }       from "chai"

describe("Resource", () => {

    let resource = null;
    let schema = {
        "id": "Person",
        "type": "object",
        "properties": {
            "firstname": {"type": "string"},
            "lastname": {"type": "string"},
            "age": {"type": "number"},
            "username": {
                "type": "string",
                "unique": true
            }
        },
        "additionalProperties": false
    };

    beforeEach((done) => {
        resource = new Resource(Date.now() + "_test", schema);
        done();
    })

    afterEach((done) => {
        rimraf(resource.filename, done);
    })

    it("Should save a record to disk", (done) => {
        resource.create({ firstname: "John" })
            .then((data) => {
                data.should.not.be.undefined
                data._id.should.not.be.undefined
            })
            .should.be.fulfilled
            .notify(done);
    })

    it("Should fail to create a record with invalid schema", (done) => {
        resource.create({ firstname: "John", bad: "property" })
            .should.be.rejected
            .notify(done);
    })

    it("Should fail to create a record if a unique property is already used", (done) => {
        resource.create({ firstname: "Cedric", username: "KebabLover69" })
            .then(() => {
                return resource.create({ firstname: "Marcel", username: "KebabLover69" })
            })
            .should.be.rejected
            .notify(done);
    })

    it("Should fetch a record by it's id", (done) => {
        resource.create({ firstname: "John" })
            .then((record) => resource.get(record._id))
            .then((record) => {
                record.should.exist
            })
            .should.be.fulfilled
            .notify(done);
    })

    it("Should find a record by it's properties", (done) => {
        resource.create({ firstname: "John" })
            .then((record) => resource.find({ firstname: "John" }))
            .then((records) => {
                records.should.exist
                expect(records).to.have.lengthOf(1);
            })
            .should.be.fulfilled
            .notify(done);
    })

    it("Should update a record", (done) => {
        resource.create({ firstname: "John", lastname: "Smith" })
            .then((record) => resource.get(record._id))
            .then((record) => {
                expect(record).not.to.be.null;
                expect(record).not.to.be.undefined;
                record.lastname = "Doe";
                return resource.update(record._id, record);
            })
            .then((r) => {
                expect(r).not.to.be.null;
                expect(r.lastname).to.equal("Doe");
            })
            .should.be.fulfilled
            .notify(done);
    })
    
    it("Should attach a file to a record", (done) => {
        resource.create({ firstname: "John", lastname: "Smith" })
            .then((record) => resource.get(record._id))
            .then((record) => {
                let file = path.join(__dirname, 'samples', 'sample_image.png');
                return resource.attach(record._id, 'myimage', file);
            })
            .then((r) => {
                expect(r).to.be.an('object');
                expect(r.lastname).to.equal("Smith");
                expect(r._attachments).to.be.an('array');
                expect(r._attachments).to.be.of.length(1);

                const att = r._attachments[0];
                expect(att).not.to.be.undefined;
                expect(att.name).to.equal('myimage');
                expect(att.file).to.be.a('string');
                expect(att.id).to.be.a('string');
            })
            .should.be.fulfilled
            .notify(done);
    })

    it("Should fail to attach a bad file to a record", (done) => {
        resource.create({ firstname: "John", lastname: "Smith" })
            .then((record) => resource.get(record._id))
            .then((record) => {
                let file = path.join(__dirname, 'samples', './i.dont.exist');
                return resource.attach(record._id, 'myimage', file);
            })
            .should.be.rejected
            .notify(done);
    })

    it("Should read an attachment from it's id", (done) => {
        resource.create({ firstname: "John", lastname: "Smith" })
            .then((record) => resource.get(record._id))
            .then((record) => {
                let file = path.join(__dirname, 'samples', 'sample_image.png');
                return resource.attach(record._id, 'myimage', file);
            })
            .then((record) => {
                const att     = record._attachments[0];
                const stream  = resource.readAttachment(att.id);

                expect(stream).to.be.an('object');
                expect(stream.pipe).to.be.a('function');
            })
            .should.be.fulfilled
            .notify(done);
    })

    it("Should delete an attachment from it's id", (done) => {
        resource.create({ firstname: "John", lastname: "Smith" })
            .then((record) => resource.get(record._id))
            .then((record) => {
                let file = path.join(__dirname, 'samples', 'sample_image.png');
                return resource.attach(record._id, 'myimage', file);
            })
            .then((record) => {
                const att     = record._attachments[0];
                const stream  = resource.readAttachment(att.id);

                return resource.deleteAttachment(record._id, att.id);
            })
            .then((record) => {
                expect(record._attachments).to.be.of.length(0);
            })
            .should.be.fulfilled
            .notify(done);
    })

    it("Should delete a record by it's id", (done) => {
        let id;
        resource.create({ firstname: "John" })
            .then((record) => {
                id = record._id;
                resource.remove(record._id)
            })
            .then(() => resource.get(id))
            .should.eventually.be.null
            .notify(done);
    })

    it("Should support pagination", async () => {
        for (let i = 0; i < 10; ++i) {
            await resource.create({ username: "random " + i })
        }

        let page1 = await resource.find({}, { pageSize: 6, page: 1 });
        expect(page1).to.be.an('array');
        expect(page1.length).to.equal(6);

        let page2 = await resource.find({}, { pageSize: 6, page: 2 });
        expect(page2).to.be.an('array');
        expect(page2.length).to.equal(4);
    })

})