import { Router }       from "express"
import bodyParser       from "body-parser"
import _                from "lodash"
import session          from "./session"
import { 
    Error, 
    INVALID_USERNAME_PW, 
    UNAUTHORIZED }   from "../utils/errors"

const DEFAULT_PERMISSIONS = {
    ALL_ACCESS: { "*" : [ 'read', 'create', 'update', 'remove' ] },
    READ_ONLY: { "*" : [ 'read' ] }
};

export default function (pocket) {
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
            if (_.find(groups, grp => pocket.users.isAdminGroup(grp))) {
                // We allow the very first admin to register
                let admins = await userManager.getAdmins();
                if (admins.length > 0) {
                    throw UNAUTHORIZED;
                }
            }

            let user = await userManager.create(req.body.username, req.body.password, groups, DEFAULT_PERMISSIONS.READ_ONLY);
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
        if (!req.user) {
            return UNAUTHORIZED.send(res);
        }
        return res.json({
            authenticated: true,
            token: req.user.jwt(),
            user: req.user.toPlainObject()
        });
    })

    router.get("/status", authenticate, (req, res) => {
        return res.json({
            authenticated: !!req.user,
            user: req.user && req.user.toPlainObject()
        });
    })
    
    return router;
};