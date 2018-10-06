import { Resource }     from "../../src/Resource";
import path             from "path"
import rimraf           from "rimraf"
import _                from "lodash"
import schema           from "../../src/schemas/posts"
import { expect }       from "chai"

describe("Post Schema", () => {

    let posts = new Resource(Date.now() + "_test", schema);
    let validate = (obj, printError = true) => {
        return posts.validate(obj)
            .catch((err) => {
                if (printError)
                    console.log(err);
                throw err;
            });
    };

    after((done) => {
        rimraf(posts.filename, done);
    })

    it("Should support media type", (done) => {
        validate({ type: "media" })
            .should.be.fulfilled
            .notify(done);
    })

    it("Should support achievement type", (done) => {
        validate({ type: "achievement", message: "hello" })
            .should.be.fulfilled
            .notify(done);
    })

    it("Should require a message for achievements", (done) => {
        validate({ type: "achievement" }, false)
            .should.be.rejected
            .notify(done);
    })

    it("Should not allow empty messages for achievements", (done) => {
        validate({ type: "achievement", message: "" }, false)
            .should.be.rejected
            .notify(done);
    })

    it("Should support statistics type", (done) => {
        validate({ type: "statistics", "stats": [{ key: "statA", value: 222 }] })
            .should.be.fulfilled
            .notify(done);
    })

    it("Should require at least one stat for statistics", (done) => {
        validate({ type: "statistics", "stats": [] }, false)
            .should.be.rejected
            .notify(done);
    })

    it("Should forbid invalid types", (done) => {
        validate({ type: "not a valid type" }, false)
            .should.be.rejected
            .notify(done);
    })

})