import * as mysql from 'mysql';

const createConnection = () => mysql.createConnection({
    host: 'localhost',
    user: 'George',
    password: 'Hello, world!',
    database: 'photon_data'
});

export const escape = mysql.escape;

// tslint:disable-next-line:no-any
export function executeQuery(sqlStr: string, values?: any) {

    const connection = createConnection();

    return new Promise((resolve, reject) => {
        // tslint:disable-next-line:no-any
        const callback = (err: any, results: any, fields: any) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        };

        if (values) {
            connection.query(sqlStr, values, callback);
        } else {
            connection.query(sqlStr, callback);
        }

        connection.end();
    });
}