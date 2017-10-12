"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mysql = require("mysql");
var createConnection = function () { return mysql.createConnection({
    host: 'localhost',
    user: 'George',
    password: 'Hello, world!',
    database: 'photon_data'
}); };
exports.default = createConnection;
//# sourceMappingURL=mysqlConnector.js.map