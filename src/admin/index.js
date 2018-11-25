const Bundler                  = require('parcel-bundler');
const express                  = require('express');
const env                      = require('../utils/env');

const OUT_DIR = __dirname + '/dist_admin';

module.exports = function (pocket) {
    let router          = express.Router();

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