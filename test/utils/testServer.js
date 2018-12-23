const express  = require("express");
const Pocket   = require("../../src/pocket");
const _        = require("lodash");
const http     = require("http");

let app = express();
let pocket = new Pocket();

pocket.resource('posts', require('../samples/schemas/posts'));
app.use(pocket.middleware());

app.set('pocket', pocket);

module.exports = app;