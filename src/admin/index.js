import Bundler                  from 'parcel-bundler'
import express, { Router }      from 'express'
import env                      from '../utils/env';

const OUT_DIR = __dirname + '/dist_admin';

export default function (pocket) {
    let router          = Router();

    if (env() !== "test") {
        const bundler = new Bundler(__dirname + '/frontend/index.html', {
            outDir: OUT_DIR,
            publicUrl: '/admin'
        });
        const completeBundle = bundler.bundle();
        const serve = express.static(OUT_DIR);

        router.use(async (req, res) => {
            await completeBundle;
            serve(req, res);
        });
    }

    return router;
}