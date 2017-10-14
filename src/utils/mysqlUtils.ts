import * as mysql from 'mysql';

const createConnection = () => mysql.createConnection({
    host: 'localhost',
    user: 'George',
    password: 'Hello, world!',
    database: 'photon_data'
});

export const createQuery = (queryStr: string) => {
    const connection = createConnection();
    return new Promise((resolve, reject) => {
        connection.query(queryStr, (err, results, fields) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }         
        });
        connection.end();
    });
};