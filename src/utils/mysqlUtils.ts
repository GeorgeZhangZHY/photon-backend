import * as mysql from 'mysql';
import * as expressSession from 'express-session';
import * as mysqlSession from 'express-mysql-session';

const options = {
    host: 'localhost',
    user: 'George',
    password: 'Hello, world!',
    database: 'photon_data'
};

const createConnection = () => mysql.createConnection(options);

// tslint:disable-next-line:no-any
const MysqlStore = (<any> mysqlSession)(expressSession);

export const sessionStore = new MysqlStore(options);

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
            connection.query(sqlStr, values, callback); // values会自动被sql转义，避免sql注入攻击
        } else {
            connection.query(sqlStr, callback);
        }

        connection.end();
    });
}