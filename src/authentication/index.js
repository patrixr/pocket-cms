const { Router }       = require("express");
const bodyParser       = require("body-parser");
const _                = require("lodash");
const session          = require("./session");
const {
    Error,
    INVALID_USERNAME_PW,
    UNAUTHORIZED }   = require("../utils/errors");

const DEFAULT_PERMISSIONS = {
    ALL_ACCESS: { "*" : [ 'read', 'create', 'update', 'remove' ] },
    READ_ONLY: { "*" : [ 'read' ] },
    NO_PERMISSIONS: {}
};

/**
 * Authentication rest api
 *
 * @export
 * @param {*} pocket
 * @returns
 */
module.exports = function (pocket) {
    let router          = Router();
    let userManager     = pocket.users;
    let userGroups      = userManager.Groups;
    let authenticate    = session(pocket);

    router.use(bodyParser.json());

    router.post("/signup", async (req, res) => {
        try {
            if (!req.body.password || !req.body.username) {
                throw INVALID_USERNAME_PW;
            }

            const groups = req.body.groups || [ userGroups.USERS ];
            const adminRegistration = _.find(groups, grp => pocket.users.isAdminGroup(grp));
            if (adminRegistration) {
                // We allow the very first admin to register
                let admins = await userManager.getAdmins();
                if (admins.length > 0) {
                    throw UNAUTHORIZED;
                }
            }

            let user = await userManager.create(req.body.username, req.body.password, groups, DEFAULT_PERMISSIONS.NO_PERMISSIONS);
            res.json({
                authenticated: true,
                token: user.jwt(),
                user: user.toPlainObject()
            });

        } catch (e) {
            Error.fromException(e).send(res);
        }
    })

    router.post("/logout", (req, res) => {
        res.json({
            token: null
        })
    })

    router.post("/login", async (req, res) => {
        try {
            const user = await userManager.auth(req.body.username, req.body.password);
            res.json({
                authenticated: true,
                token: user.jwt(),
                user: user.toPlainObject()
            });
        } catch (e) {
            Error.fromException(e).send(res);
        }
    });

    router.get("/refresh", authenticate, (req, res) => {
        const user = _.get(req, 'ctx.user');
        if (!user) {
            return UNAUTHORIZED.send(res);
        }
        return res.json({
            authenticated: true,
            token: user.jwt(),
            user: user.toPlainObject()
        });
    })

    router.get("/status", authenticate, (req, res) => {
        return res.json({
            authenticated: !!user,
            user: user && user.toPlainObject()
        });
    })

    return router;
};