import createConnection from './mysqlConnector';

export default function fetchRegions(): Promise<{}> {

    const connection = createConnection();
    connection.connect();
    const queryStr = 'SELECT rid AS code, rname as name FROM regions';

    return new Promise((resolve, reject) => {
        connection.query(queryStr, (err, results, fields) => {
            if (err) {
                reject(err);
            }
            resolve(results);
        });
        connection.end();
    });
}
