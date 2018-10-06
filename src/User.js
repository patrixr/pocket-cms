import { Resource }         from "./Resource"
import bcrypt               from "bcrypt"
import Q                    from "q"
import _                    from "lodash"
import jwt                  from "jsonwebtoken"
import keys                 from "../config/keys"
import config               from "../config"
import { 
    INVALID_USER_GROUP,
    INVALID_USERNAME_PW,
    SESSION_EXPIRED,
    USERNAME_TAKEN, 
    UNAUTHORIZED, 
    INTERNAL_ERROR }   from "./utils/errors"

export default class User {

    static get Groups() {
        return {
            ADMINS: "admins",
            USERS:  "users",
            TRAINERS: "trainers"
        }
    }

    static get AdminGroups() {
        return [
            User.Groups.ADMINS
        ]
    }

    static get resource() {
        if (!User._resource) {
            User._resource = User._resource || new Resource("_users", {
                "id": "User",
                "type": "object",
                "properties": {
                    "username": {"type": "string"},
                    "password": {"type": "password"},
                    "groups": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        }
                    },
                    "hash": {"type":"string"},
                    "userData": {"type": "object"}
                },
                "additionalProperties": false
            });
        }
        return User._resource;
    }

    // ---- STATIC METHODS

    static hashPassword(password) {
        const saltRounds = 3;
        return bcrypt
            .hash(password, saltRounds)
    }

    /**
     * Tries to load an existing user
     * 
     * @param {*} username 
     * @param {*} password 
     */
    static async auth(username, password) {
        const userRecord = await User.resource.findOne({ username : username });
        if (!userRecord) throw INVALID_USERNAME_PW;

        const valid = await bcrypt.compare(password, userRecord.hash);
        if (!valid) throw INVALID_USERNAME_PW;

        let user = new User();
        user.username   = userRecord.username;
        user.groups     = userRecord.groups;
        user.hash       = userRecord.hash;
        user.id         = userRecord._id;

        return user;
    }

    /**
     * Creates a new user (does not save it)
     * 
     * @param {*} username 
     * @param {*} password
     * @param {*} groups
     */
    static async create(username, password, groups = [ "users" ]) {
        if (_.isString(groups)) {
            groups = [ groups ];
        }

        for (let group of groups) {
            if (!_.find(_.values(User.Groups), (g) => g === group)) {
                throw INVALID_USER_GROUP;
            }
        }

        const existing = await User.resource.findOne({ username : username });
        if (existing) {
            throw USERNAME_TAKEN;
        }
        
        let user = new User();
        user.username   = username;
        user.groups     = groups;
        user.hash       = await User.hashPassword(password);

        return user.save();
    }

    /**
     * Create a User from the db object
     * @param {*} record 
     */
    static async fromRecord(record) {
        let user        = new User();
        user.id         = record._id;
        user.groups     = record.groups;
        user.username   = record.username;
        user.hash       = record.hash;
        return user;
    }

    /**
     * Returns the list of admins
     *  
     */
    static async getAdmins() {
        let records = await User.resource.find({ groups: { $elemMatch: User.Groups.ADMINS }});
        return records.map(User.fromRecord);
    }

    /**
     * Checks if a group has admin rights
     * 
     * @static
     * @param {any} user 
     * @returns 
     * @memberof User
     */
    static isAdminGroup(group) {
        return User.AdminGroups.indexOf(group) >= 0;
    }

    /**
     * Checks if a group has admin rights
     * 
     * @static
     * @param {any} group 
     * @returns 
     * @memberof User
     */
    static isAdmin(user) {
        return !!_.find(user.groups, (g) => this.isAdminGroup(g));
    }

    /**
     * Returns the user associated with the JWT or null
     *
     * @static
     * @param {*} token
     * @memberof User
     */
    static fromJWT(token) {
        const deferred = Q.defer();
        const secret = keys.get("jwt_secret");

        jwt.verify(token, secret, (err, decoded = {}) => {
            if (err) {
                if (err.name === "TokenExpiredError") {
                    return deferred.reject(SESSION_EXPIRED);
                }
                return deferred.reject(UNAUTHORIZED);
            }

            let uid = decoded.id;
            if (!uid) {
                return deferred.reject(UNAUTHORIZED);
            }

            User.resource.get(uid)
                .then((user) => {
                    if (user) {
                        return deferred.resolve(User.fromRecord(user));
                    }
                    deferred.reject(UNAUTHORIZED);
                })
                .catch(() =>  {
                    deferred.reject(INTERNAL_ERROR)
                });
        });

        return deferred.promise;
    }


    // ---- MEMBERS

    constructor() {
        this.id                 = null;
        this.hash               = null;
        this.username           = null;
        this.groups             = null;
    }

    toPlainObject() {
        return {
            id:         this.id,
            username:   this.username,
            groups:     this.groups
        };
    }

    jwt() {
        const secret = keys.get("jwt_secret");
        const payload = _.extend({}, this.toPlainObject(), { timestamp: _.now() });
        return jwt.sign(payload, secret, {
            expiresIn: config.session.expiresIn
        });
    }

    async save() {
        const json = {
            hash:       this.hash,
            username:   this.username,
            groups:     this.groups
        }
        if (this.id) {
            return User.resource.update(this.id, json);
        }
        const record = await User.resource.create(json)
        this.id = record._id;
        return this;
    }

}