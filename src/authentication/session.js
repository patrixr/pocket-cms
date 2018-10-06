import { Error, UNAUTHORIZED } from '../utils/errors';
import User from '../User';

/**
 * Express middleware to setup user session based on the auth token
 *
 * @export
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export default function (req, res, next) {
    const auth = req.get('authorization');
    const rexp = /^Bearer .+$/i;

    if (!auth || !rexp.test(auth)) {
        return next();
    }

    const token = auth.replace(/^Bearer /i, "");

    User.fromJWT(token)
        .then(user => {
            req.user = user;
            next();
        })
        .catch(() => next());
}