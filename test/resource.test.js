import Mongod           from "mongod"
import path             from "path"
import _                from "lodash"
import { expect }       from "chai"
import Pocket           from '../src/pocket';
import { isCI }         from "../src/utils/helpers";

let mongoServer = null;
const setupsToTest = {
    'DISK': {
        config: null,
        bootstrap: (done) => done(),
        close: (done) => done()
    },
    'MONGO': {
        config: { 
            datastore: {
                adapter: "mongo",
                options: {
                    url: 'localhost:27017',
                    dbName: 'mocha_test_db'
                }
            },
        },
        bootstrap: (done) => {
            if (isCI()) {
                return done();  
            }

            console.log("Starting mongod");
            mongoServer = new Mongod(27017);
            mongoServer.open(done);
        },
        close:  (done) => {
            if (isCI()) {
                return done();
            }
            console.log("Stopping mongod");
            mongoServer.close(done);
        }
    }
}

_.each(setupsToTest, ({ config, bootstrap, close }, key) => {

    describe(`[${key}] Resource`, () => {

        let pocket = null;
        let resource = null;

        before((done) => {
            bootstrap((err) => {
                if (err) {
                    return done(err);
                }
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
                pocket = new Pocket(config);
                resource = pocket.resource("person", schema);
                pocket.jsonStore.ready().then(() => done());
            });
        });

        after((done) => {
            pocket.jsonStore.close().then(() => {
                close(done);
            });
        });

        afterEach((done) => {
            resource.drop().then(() => done());
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

        it("Should update/merge a single record", (done) => {
            resource.create({ firstname: "John", lastname: "Smith" })
                .then((record) => resource.get(record._id))
                .then((record) => {
                    expect(record).not.to.be.null;
                    expect(record).not.to.be.undefined;
                    record.lastname = "Doe";
                    return resource.mergeOne(record._id, record);
                })
                .then((r) => {
                    expect(r).not.to.be.null;
                    expect(r.lastname).to.equal("Doe");
                })
                .should.be.fulfilled
                .notify(done);
        })
        
        it("Should attach a file to a record", async () => {
            const record        = await resource.create({ firstname: "John", lastname: "Smith" })
            const file          = path.join(__dirname, 'samples', 'sample_image.png');
            const updatedRecord = await resource.attach(record._id, 'myimage', file);

            expect(updatedRecord).to.be.an('object');
            expect(updatedRecord.lastname).to.equal("Smith");
            expect(updatedRecord._attachments).to.be.an('array');
            expect(updatedRecord._attachments).to.be.of.length(1);

            const att = updatedRecord._attachments[0];
            expect(att).not.to.be.undefined;
            expect(att.name).to.equal('myimage');
            expect(att.file).to.be.a('string');
            expect(att.id).to.be.a('string');
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
                    resource.removeOne(record._id)
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

        describe("Hooks", () => {

            afterEach((done) => {
                resource.clearHooks();
                done();
            });

            it("Should allow before and after find hook", async () => {
                let beforeTriggered = false;
                let afterTrigerred = false;

                let user = await resource.create({ username: "john", firstname: "john" });

                resource.before("find", async ({ query }, ctx) => {
                    expect(ctx).to.exist;
                    expect(query).not.to.be.null;
                    expect(query._id).to.equal("badId");

                    query._id = user._id; // override
                    beforeTriggered = true;
                });

                resource.after("find", async ({ records }, ctx) => {
                    let record = records[0];
                    expect(ctx).to.exist;
                    expect(record).not.to.be.null;
                    expect(record._id.toString()).to.equal(user._id.toString());
                    expect(record.username).to.equal("john");

                    record.username = record.username + "ny";
                    afterTrigerred = true;
                });

                let foundUser = await resource.findOne({ _id: 'badId' });
                expect(beforeTriggered).to.be.true;
                expect(afterTrigerred).to.be.true;
                expect(foundUser.username).to.equal("johnny");
            });

            it("Should allow before and after validate hook", async () => {
                let beforeTriggered = false;
                let afterTrigerred = false;

                resource.before("validate", async ({ record, schema }, ctx) => {
                    expect(ctx).to.exist;
                    expect(record).to.exist;
                    expect(schema).to.exist;
                    expect(record.username).to.equal("john");
                    record.username += " was";
                    beforeTriggered = true;
                });

                resource.after("validate", async ({ record, schema, errors }, ctx) => {
                    expect(ctx).to.exist;
                    expect(record).to.exist;
                    expect(schema).to.exist;
                    expect(errors).to.exist;
                    expect(errors).to.be.an('array');
                    expect(record.username).to.equal("john was");

                    record.username += " validated";
                    afterTrigerred = true;
                });

                let user = await resource.create({ username: "john", firstname: "john" });
                expect(beforeTriggered).to.be.true;
                expect(afterTrigerred).to.be.true;
                expect(user.username).to.equal("john was validated");
            });

            it("Should allow before and after update hook", async () => {
                let beforeTriggered = false;
                let afterTrigerred = false;

                let user = await resource.create({ username: "Hulk", firstname: "patrick" });

                resource.before("update", async ({ query, operations }, ctx) => {
                    expect(ctx).to.exist;
                    expect(query).to.exist;
                    expect(operations).to.exist;
                    expect(query._id).to.equal(user._id);
                    beforeTriggered = true;
                });

                resource.after("update", async ({ records, query, operations }, ctx) => {
                    expect(ctx).to.exist;
                    expect(records).to.exist;
                    expect(query).to.exist;
                    expect(operations).to.exist;
                    expect(records[0].username).to.equal("Hulk");

                    records[0].username = "Batman";
                    afterTrigerred = true;
                });

                user = await resource.mergeOne(user._id, { firstname: "vlad" });
                expect(beforeTriggered).to.be.true;
                expect(afterTrigerred).to.be.true;
                expect(user.username).to.equal("Batman");
            });

            it("Should allow before and after remove hook", async () => {
                let beforeTriggered = false;
                let afterTrigerred = false;

                let user = await resource.create({ username: "Hulk", firstname: "patrick" });

                resource.before("remove", async ({ query, options }, ctx) => {
                    expect(ctx).to.exist;
                    expect(query).to.exist;
                    expect(options).to.exist;
                    expect(query._id).to.equal(user._id);
                    beforeTriggered = true;
                });

                resource.after("remove", async ({ query, options, removedCount }, ctx) => {
                    expect(ctx).to.exist;
                    expect(query).to.exist;
                    expect(options).to.exist;
                    expect(removedCount).to.equal(1);
                    afterTrigerred = true;
                });

                await resource.removeOne(user._id);
                expect(beforeTriggered).to.be.true;
                expect(afterTrigerred).to.be.true;
            });

            it("Should allow before create and save hooks", async () => {
                let wasCreated = false;
                let wasSaved = false;

                resource.before("create", async ({ payload }, ctx) => {
                    expect(ctx).to.exist;
                    expect(payload).not.to.be.null;
                    expect(payload.firstname).to.equal("john");
                    expect(payload.username).to.equal("test");
                    wasCreated = true;
                    payload.username = payload.username + "!"
                });

                resource.before("save", async ({ payload }, ctx) => {
                    expect(ctx).to.exist;
                    expect(payload).not.to.be.null;
                    expect(payload.firstname).to.equal("john");
                    expect(payload.username).to.equal("test!");
                    wasSaved = true;
                    payload.username = payload.username + "@"
                });

                let user = await resource.create({ username: "test", firstname: "john" });
                expect(wasCreated).to.be.true;
                expect(wasSaved).to.be.true;
                expect(user.username).to.equal("test!@");
            })

            it("Should allow after create and save hooks", async () => {
                let wasCreated = false;
                let wasSaved = false;
                resource.after("create", async ({ record }, ctx) => {
                    expect(ctx).to.exist;
                    expect(record).not.to.be.null;
                    expect(record._id).not.to.be.null;
                    expect(record.firstname).to.equal("john");
                    expect(record.username).to.equal("test");

                    record.username = record.username + "!";

                    const inStoreRecord = resource.get(record._id);
                    expect(inStoreRecord).not.to.be.null;
                    wasCreated = true;
                });

                resource.after("save", async ({ record }, ctx) => {
                    expect(ctx).to.exist;
                    expect(record).not.to.be.null;
                    expect(record._id).not.to.be.null;
                    expect(record.firstname).to.equal("john");
                    expect(record.username).to.equal("test!");

                    record.username = record.username + "@";

                    const inStoreRecord = resource.get(record._id);
                    expect(inStoreRecord).not.to.be.null;
                    wasSaved = true;
                });

                let user = await resource.create({ username: "test", firstname: "john" });
                expect(wasCreated).to.be.true;
                expect(wasSaved).to.be.true;
                expect(user.username).to.equal("test!@");
            })
        });

    });
});