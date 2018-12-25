const _                    = require("lodash");
const { expect }           = require("chai");
const Q                    = require("q");
const config               = require("../src/utils/config");
const Pocket               = require('../src/pocket');

describe("Users", () => {

    let pocket      = null;
    let userManager = null;

    function randomName() {
        return "john-" + Math.random()
    }

    before((done) => {
        pocket = new Pocket();
        userManager = pocket.users;
        userManager.create("john", "123456", userManager.Groups.ADMINS)
            .then(() => done());
    });

    after((done) => {
        userManager.resource.drop().then(() => done());
    })

    it("Should create an admin user", async () => {
        let user = await userManager.create("patrick", "123456", userManager.Groups.ADMINS)
        expect(user).not.to.be.null;
        expect(user.groups.length).to.equal(1);
        expect(user.groups[0]).to.equal(userManager.Groups.ADMINS);
        expect(user.username).to.equal("patrick");
    })

    it("Should fail to create a user with an existing nickname", (done) => {
        expect(
            userManager.create("john", "123456", userManager.Groups.ADMINS)
        )
        .to.eventually.be.rejected
        .notify(done);
    })

    it("Should not load a user with a wrong password", (done) => {
        expect(userManager.auth("john", "wrongpassword"))
            .to.eventually.be.rejected
            .notify(done)
    })

    it("Should load a user with the correct password", (done) => {
        expect(userManager.auth("john", "123456"))
            .to.eventually.be.fulfilled
            .notify(done)
    })

    it("Should fail to load a user fro, an expired JWT token", (done) => {
        let jwt = null;
        let expirationTimeout = config.session.expiresIn;
        config.session.expiresIn = 1; // 1 second
        let promise = userManager.auth("john", "123456")
            .then(user => {
                jwt = user.jwt();
                config.session.expiresIn = expirationTimeout; // restore
                return Q.delay(1500);
            })
            .then(() => {
                // jwt is now expired
                return userManager.fromJWT(jwt);
            });

        expect(promise)
            .to.be.rejected
            .notify(done);
    })

    it("Should have created the default _groups upon startup", async () => {
        const allGroups = _.map(await pocket.resource('_groups').find({}), 'name');
        _.each(['admins', 'users'], baseGroup => {
            expect(_.includes(allGroups, baseGroup)).to.be.true;
        });
    });

    _.each([ 'admins', 'users' ], (name) => {
        it(`Should not be possible to delete the default ${name} group`, async () => {
            let rejected = false;
            try {
                await pocket.resource('_groups').remove({ name });
            } catch (e) {
                rejected = true;
            }
            expect(rejected).to.be.true;
        });
    });

    it("Should prevent saving a user with a non-existing group name", async () => {
        let rejected = false;
        try {
            await userManager.create("bruce_wayne", "123456", 'invalid_group_name');
        } catch (e) {
            rejected = true;
        }
        expect(rejected).to.be.true;
    });

})