/**
 * Express middleware to setup user session based on the auth token
 *
 * @export
 */
export default function (pocket) {
    const userManager = pocket.users;

    return function (req, res, next) {
        const auth = req.get('authorization');
        const rexp = /^Bearer .+$/i;

        if (!auth || !rexp.test(auth)) {
            return next();
        }

        const token = auth.replace(/^Bearer /i, "");

        userManager.fromJWT(token)
            .then(user => {
                req.user = user;
                next();
            })
            .catch(() => next());
    }
}