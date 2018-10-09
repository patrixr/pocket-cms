import Q                from "q"
import request          from "supertest"
import path             from "path"
import rimraf           from "rimraf"
import _                from "lodash"
import config           from "../src/utils/config";
import TestServer       from "./server"
import { expect }       from "chai"
import CMS              from "../src/CMS"
import User             from '../src/User';

describe("Rest", () => {

    // ---- Setup

    before((done) => {
        TestServer.run(done);
    })

    beforeEach((done) => {
        Q.all(
            _.values(CMS.resources).map(r => r.drop())  
        )
        .then(() => done());
    })

    after((done) => {
        TestServer.close();
        _.values(CMS.resources)
            .forEach(r => {
                console.log(`\n\t# Dropping database ${r.name}.db`);
                rimraf.sync(r.filename);
            });
        rimraf.sync(config.filestore.options.uploadFolder);
        done();
    })

    // ---- Helpers

    let properties = [ "type", "message" ];
    let sampleData = {
        type: "achievement",
        message: "test"
    };

    function testFile(name) {
        return path.join(__dirname, 'samples', name);
    }

    async function createPost(userId) {
        const posts = CMS.getResource('posts');
        const newPost = await posts.create(sampleData, { userId });
        expect(newPost._id).to.exist;
        expect(newPost._id).to.not.be.null;
        return newPost;
    }

    async function createPosts(count, userId) {
        for(let i = 0; i < count; ++i) {
            await createPost(userId);
        }
    }

    // ---- Tests

    describe("Web Service /rest", () => {

        before((done) => {
            config.testing.disableAuthentication = true;
            done();
        });

        after((done) => {
            config.testing.disableAuthentication = false;
            done();
        });

        it("Should return empty array if the db is empty", (done) => {
            request(TestServer.baseUrl)
                .get('/rest/posts')
                .expect(200)
                .expect('Content-Type', /json/)
                .expect('Content-Length', '2')
                .expect([])
                .end(done);
        })

        it("Should create an item with a post request", (done) => {
            request(TestServer.baseUrl)
                .post('/rest/posts')
                .send(sampleData)
                .expect(200)
                .end(done)
        })

        it("Should fail to create a record with an invalid schema", (done) => {
            request(TestServer.baseUrl)
                .post('/rest/posts')
                .send(_.extend({}, sampleData, { bad: 'property'}))
                .expect(400)
                .end(done);
        })
        it("Should support pagination", async () => {
            await createPosts(10);

            let res1 = await request(TestServer.baseUrl)
                .get('/rest/posts')
                .query({ pageSize: 6, page: 1 })
                .expect(200)
                .expect('Content-Type', /json/)
                
            let page1 = res1.body;
            expect(page1).to.be.an('array');
            expect(page1).to.have.length(6);

            let res2 = await request(TestServer.baseUrl)
                .get('/rest/posts')
                .query({ pageSize: 6, page: 2 })
                .expect(200)
                .expect('Content-Type', /json/)
                
            let page2 = res2.body;
            expect(page2).to.be.an('array');
            expect(page2).to.have.length(4);
        })

        it("Should retrieve the full list of items", async () => {
            await createPosts(10);

            const response = await request(TestServer.baseUrl)
                .get('/rest/posts')
                .expect(200)
                .expect('Content-Type', /json/);
                
            const body = response.body;
            expect(body).to.been.an('array');
            expect(body).to.have.lengthOf(10);
            const record = body[0];
            expect(record).to.contain.keys([ ...properties, "_id" ]);
            expect(_.pick(record, properties)).to.deep.equal(sampleData);
        })

        it("Should fetch a single record using it's id", async () => {
            let post = await createPost();
            let response = await request(TestServer.baseUrl)
                .get(`/rest/posts/${post._id}`)
                .expect(200)
                .expect('Content-Type', /json/);

            const record = response.body;
            expect(record).to.been.an('object');
            expect(record).to.contain.keys([ ...properties, "_id" ]);
            expect(_.pick(record, properties)).to.deep.equal(sampleData);
        })

        it("Should update an item with a post", async () => {
            let post = await createPost();
            console.log(post);
            await request(TestServer.baseUrl)
                .put(`/rest/posts/${post._id}`)
                .send({ message: 'new message' })
                .expect(200);

            let { body }  = await request(TestServer.baseUrl)
                .get(`/rest/posts/${post._id}`);
            
            expect(body).to.been.an('object');
            expect(body).to.contain.keys([ ...properties, "_id" ]);
            expect(body.message).to.equal('new message');
        })

        it("Should attach a file an item with a post", async () => {
            let post = await createPost();
            let { body } = await request(TestServer.baseUrl)
                .post(`/rest/posts/${post._id}/attachments`)
                .attach('myfile', testFile('sample_image.png'))
                .expect(200);
            
            expect(body).to.be.an('object');
            expect(body._attachments).to.be.an('array');
            expect(body._attachments).to.be.of.length(1);
            let att = body._attachments[0];
            expect(att.name).to.equal('myfile');
            expect(att.id).to.be.a('string');
        })

        it("Should fail to download an attachment with a bad id", async () => {
            let post = await createPost();
            await request(TestServer.baseUrl)
                .get(`/rest/posts/${post._id}/attachments/badid`)
                .expect(404);
        })

        it("Should fail to download an attachment of a record that doesn't exist", async () => {
            await request(TestServer.baseUrl)
                .get(`/rest/posts/idontexist/attachments/1234`)
                .expect(404);
        })

        it("Should download an attachment from it's id", async () => {
            let post = await createPost();
            let { body } = await request(TestServer.baseUrl)
                .post(`/rest/posts/${post._id}/attachments`)
                .attach('myfile', testFile('sample_image.png'))
                .expect(200);
            
            expect(body._attachments[0].id).to.exist;
            expect(body._attachments[0].id).not.to.be.null;

            let { headers } = await request(TestServer.baseUrl)
                .get(`/rest/posts/${post._id}/attachments/${body._attachments[0].id}`)
                .expect(200);

            expect(headers['content-type']).to.equal('image/png');
            expect(_.toFinite(headers['content-length'])).to.be.above(70000);
        })

        it("Should delete an attachment from it's id", async () => {
            const resource = CMS.getResource('posts');

            // Create a post with an attachment
            let { _id } = await createPost();
            let post = await resource.attach(_id, 'myimage', path.join(__dirname, 'samples', 'sample_image.png'));
            expect(post._attachments.length).to.equal(1);

            // Delete the attachment
            let attachmentId = post._attachments[0].id;
            await request(TestServer.baseUrl)
                .delete(`/rest/posts/${_id}/attachments/${attachmentId}`)
                .expect(200);

            let updatedPost = await resource.get(_id);
            expect(updatedPost._attachments.length).to.equal(0);
            
            await request(TestServer.baseUrl)
                .get(`/rest/posts/${_id}/attachments/${attachmentId}`)
                .expect(404);
        })

        it("Should delete a record using it's id", async () => {
            let { _id } = await createPost();

            await request(TestServer.baseUrl)
                .delete(`/rest/posts/${_id}`)
                .expect(200);

            await request(TestServer.baseUrl)
                .get(`/rest/posts/${_id}`)
                .expect(404);
        })

    });

    describe("Authentication api /users", () => {

        afterEach((done) => {
            User.resource.drop().then(() => {
                done();
            });
        })

        it("Should not allow login with a bad user or password", (done) => {
            request(TestServer.baseUrl)
                .post("/users/login")
                .send({
                    username: "bad",
                    password: "credentials"
                })
                .expect(401)
                .end(done);
        });

        it("Should allow registering an admin if there are none", (done) => {
            request(TestServer.baseUrl)
                .post("/users/signup")
                .send({
                    username: "admin",
                    password: "password",
                    groups: [ "admins" ]
                })
                .expect(200)
                .end(done);
        });

        it("Should sign in and receive an authentication token", async () => {
            await User.create("admin", "password", [ "admins" ]);
            const { body } = 
                await request(TestServer.baseUrl)
                    .post("/users/login")
                    .send({
                        username: "admin",
                        password: "password"
                    })
                    .expect(200);

            const { authenticated, token, user } = body;

            expect(authenticated).to.be.true;
            expect(token).to.be.a('string');
            expect(token.length).to.be.greaterThan(0);
            expect(user).to.be.an('object');
            expect(user.username).to.equal("admin");
            expect(user.id.length).to.be.greaterThan(0);
        });

        it("Should allow users to refresh their jwt token", async () => {
            await User.create("admin", "password", [ "admins" ]);
            const loginResponse = 
                await request(TestServer.baseUrl)
                    .post("/users/login")
                    .send({
                        username: "admin",
                        password: "password"
                    })
                    .expect(200);

            const token = loginResponse.body.token;
            expect(token).to.be.a('string');
            expect(token.length).to.be.greaterThan(0);

            const refreshResponse = await request(TestServer.baseUrl)
                    .get("/users/refresh")
                    .set('Authorization', 'Bearer ' + token)
                    .expect(200);

            const refreshedToken = refreshResponse.body.token;
            expect(refreshedToken).to.be.a('string');
            expect(refreshedToken.length).to.be.greaterThan(0);
            expect(refreshedToken !== token).to.be.true;
        });

        it("Should not allow registering an admin if there is already one", async () => {
            await User.create("admin1", "password", [ "admins" ]);
            await request(TestServer.baseUrl)
                .post("/users/signup")
                .send({
                    username: "admin2",
                    password: "password2",
                    groups: [ "admins", "users" ]
                })
                .expect(401);
        });

        it("Should allow registering a normal user", async () => {
            const { body } = await request(TestServer.baseUrl)
                .post("/users/signup")
                .send({
                    username: "user1",
                    password: "hello_world",
                    groups: [ "users" ]
                })
                .expect(200);

            const { authenticated, token, user } = body;

            expect(authenticated).to.be.true;
            expect(token).to.be.a('string');
            expect(token.length).to.be.greaterThan(0);
            expect(user).to.be.an('object');
            expect(user.username).to.equal("user1");
            expect(user.id.length).to.be.greaterThan(0);
        });

        it("Should prevent registering a user with an existing username", async () => {
            await User.create("user1", "password", [ "admins" ]);
            await request(TestServer.baseUrl)
                .post("/users/signup")
                .send({
                    username: "user1",
                    password: "hello_worldzz",
                    groups: [ "users" ]
                })
                .expect(409);
        });

    })

    describe("Global Webservice security /rest/:resource", () => {

        beforeEach((done) => {
            config.testing.disableAuthentication = false;
            Q.all([
                User.create("adminUser", "password", [ "admins" ]),
                User.create("noPermissionUser", "password", [ "users" ]),
                User.create("readUser", "password", [ "users" ], { "posts": [ "read" ] }),
                User.create("createUser", "password", [ "users" ], { "posts": [ "create" ] })
            ])
            .then(() => done())
            .catch(e => console.log(e));
        })

        afterEach((done) => {
            User.resource.drop().then(() => {
                config.testing.disableAuthentication = true;
                done();
            });
        })

        async function logIn(username, password) {
            const { body } = await request(TestServer.baseUrl)
                .post("/users/login")
                .send({ username, password })
                .expect(200);
            
            return body.token;
        }

        it("Should fail to create an item when not logged in", async () => {
            await request(TestServer.baseUrl)
                .post(`/rest/posts`)
                .send(sampleData)
                .expect(401);
        })

        it("Should fail to update an item when not logged in", async () => {
            let post = await createPost();
            await request(TestServer.baseUrl)
                .post(`/rest/posts/${post._id}`)
                .send({ message: 'new message' })
                .expect(401);
        })

        it("Should fail to read an item when not logged in", async () => {
            let post = await createPost();
            await request(TestServer.baseUrl)
                .get(`/rest/posts/${post._id}`)
                .expect(401);
        })

        it("Should fail to delete an item when not logged in", async () => {
            let post = await createPost();
            await request(TestServer.baseUrl)
                .delete(`/rest/posts/${post._id}`)
                .expect(401);
        })

        it("Should only be able to read items with READ permission", async () => {
            const tokenA = await logIn("noPermissionUser", "password");
            await request(TestServer.baseUrl)
                .get(`/rest/posts`)
                .set('Authorization', 'Bearer ' + tokenA)
                .expect(403);

            const tokenB = await logIn("readUser", "password");
            await request(TestServer.baseUrl)
                .get(`/rest/posts`)
                .set('Authorization', 'Bearer ' + tokenB)
                .expect(200);
        })

        it("Should only be able to create items with CREATE permission", async () => {
            const tokenA = await logIn("noPermissionUser", "password");
            await request(TestServer.baseUrl)
                .post(`/rest/posts`)
                .set('Authorization', 'Bearer ' + tokenA)
                .send(sampleData)
                .expect(403);

            const tokenB = await logIn("createUser", "password");
            await request(TestServer.baseUrl)
                .post(`/rest/posts`)
                .set('Authorization', 'Bearer ' + tokenB)
                .send(sampleData)
                .expect(200);
        })

        it("Should permit creating an item after logging in as Admin", async () => {
            const token = await logIn("adminUser", "password");
            await request(TestServer.baseUrl)
                .post(`/rest/posts`)
                .set('Authorization', 'Bearer ' + token)
                .send(sampleData)
                .expect(200);
        })

    })

    describe("User api prefix (/rest/users/:userId/:resource)", () => {

        let uid = null;

        beforeEach((done) => {
            config.testing.disableAuthentication = false;
            User.create("testuser", "password", [ "admins" ])
                .then((user) => {
                    uid = user.id;
                    done()
                })
                .catch(e => console.log(e));
        })

        afterEach((done) => {
            User.resource.drop().then(() => {
                config.testing.disableAuthentication = true;
                done();
            });
        })

        async function logIn(username, password) {
            const { body } = await request(TestServer.baseUrl)
                .post("/users/login")
                .send({ username, password })
                .expect(200);
            
            return body.token;
        }

        it("Should fail to create an item when not logged in", async () => {
            await request(TestServer.baseUrl)
                .post(`/rest/users/${uid}/posts`)
                .send(sampleData)
                .expect(401);
        })

        it("Should fail to update an item when not logged in", async () => {
            let post = await createPost();
            await request(TestServer.baseUrl)
                .post(`/rest/users/${uid}/posts/${post._id}`)
                .send({ message: 'new message' })
                .expect(401);
        })

        it("Should fail to read an item when not logged in", async () => {
            let post = await createPost();
            await request(TestServer.baseUrl)
                .get(`/rest/users/${uid}/posts/${post._id}`)
                .expect(401);
        })

        it("Should fail to delete an item when not logged in", async () => {
            let post = await createPost();
            await request(TestServer.baseUrl)
                .delete(`/rest/users/${uid}/posts/${post._id}`)
                .expect(401);
        })

        it("Should permit creating an item as a user", async () => {
            const token = await logIn("testuser", "password");
            const { body } = await request(TestServer.baseUrl)
                .post(`/rest/users/${uid}/posts`)
                .set('Authorization', 'Bearer ' + token)
                .send(sampleData)
                .expect(200);

            expect(body._createdBy).to.equal(uid);
        })

        it("Should only read posts for that specific user", async () => {
            await createPosts(10);
            await createPosts(3, uid);

            const token = await logIn("testuser", "password");
            const { body } = await request(TestServer.baseUrl)
                .get(`/rest/users/${uid}/posts`)
                .set('Authorization', 'Bearer ' + token)
                .expect(200);

            expect(body).to.be.an('array');
            expect(body.length).to.equal(3);
        })

    })

})