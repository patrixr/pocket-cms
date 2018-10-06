import { Router }       from "express"
import bodyParser       from "body-parser"
import User             from "../User"
import authenticate     from "./session"
import _                from "lodash"
import { 
    Error, 
    INVALID_USERNAME_PW, 
    UNAUTHORIZED }   from "../utils/errors"

export default function () {
    let router = Router();

    router.use(bodyParser.json());

    router.post("/signup", async (req, res) => {
        try {
            if (!req.body.password || !req.body.username) {
                throw INVALID_USERNAME_PW;
            }
            
            const groups = req.body.groups || [ User.Groups.USERS ];
            if (_.find(groups, grp => User.isAdminGroup(grp))) {
                let admins = await User.getAdmins();
                if (admins.length > 0) {
                    throw UNAUTHORIZED;
                }
            }

            let user = await User.create(req.body.username, req.body.password, groups);
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
            const user = await User.auth(req.body.username, req.body.password);
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