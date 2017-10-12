"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mysqlConnector_1 = require("./mysqlConnector");
function fetchRegions() {
    var connection = mysqlConnector_1.default();
    connection.connect();
    var queryStr = 'SELECT rid AS code, rname as name FROM regions';
    return new Promise(function (resolve, reject) {
        connection.query(queryStr, function (err, results, fields) {
            if (err) {
                reject(err);
            }
            resolve(results);
        });
        connection.end();
    });
}
exports.default = fetchRegions;
//# sourceMappingURL=region.js.map