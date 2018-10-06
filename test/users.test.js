import _                    from "lodash"
import { expect }           from "chai"
import Q                    from "q"
import User                 from "../src/User"
import config               from "../config"
import rimraf               from "rimraf"

describe("Users", () => {

    function randomName() {
        return "john-" + Math.random()
    }

    before((done) => {
        User.create("john", "123456", User.Groups.ADMINS)
            .then(() => done());
    });

    after((done) => {
       rimraf(User.resource.filename, done);
    })

    it("Should create an admin user", async () => {
        let user = await User.create("patrick", "123456", User.Groups.ADMINS)
        expect(user).not.to.be.null;
        expect(user.groups.length).to.equal(1);
        expect(user.groups[0]).to.equal(User.Groups.ADMINS);
        expect(user.username).to.equal("patrick");
    })

    it("Should fail to create a user with an existing nickname", (done) => {
        expect(
            User.create("john", "123456", User.Groups.ADMINS)
        )
        .to.eventually.be.rejected
        .notify(done);
    })

    it("Should fail to create a user of an unknown group", (done) => {
        expect(User.create("bob", "123456", "invalid_group"))
            .to.eventually.be.rejected.notify(done);
    })

    it("Should not load a user with a wrong password", (done) => {
        expect(User.auth("john", "wrongpassword"))
            .to.eventually.be.rejected
            .notify(done)
    })

    it("Should load a user with the correct password", (done) => {
        expect(User.auth("john", "123456"))
            .to.eventually.be.fulfilled
            .notify(done)
    })

    it("Should fail to load a user from an expired JWT token", (done) => {
        let jwt = null;
        let expirationTimeout = config.session.expiresIn;
        config.session.expiresIn = 1; // 1 second
        let promise = User.auth("john", "123456")
            .then(user => {
                jwt = user.jwt();
                config.session.expiresIn = expirationTimeout; // restore
                return Q.delay(1500);
            })
            .then(() => {
                // jwt is now expired
                return User.fromJWT(jwt);
            });

        expect(promise)
            .to.be.rejected
            .notify(done);
    })

})