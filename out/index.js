"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var region_1 = require("./region");
var express = require("express");
var app = express();
var permittedOrigin = 'http://localhost:3000';
app.get('/', function (req, res) {
    res.send('Hello, world!');
});
app.get('/regions', function (req, res) {
    region_1.default().then(function (result) {
        res.setHeader('Access-Control-Allow-Origin', permittedOrigin);
        res.send(result);
    }).catch(function (err) {
        throw err;
    });
});
var server = app.listen(8080, function () {
    var address = server.address();
    console.log("server running at http://" + address.address + ":" + address.port);
});
//# sourceMappingURL=index.js.map