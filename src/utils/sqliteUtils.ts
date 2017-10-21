import * as sqlite3 from 'sqlite3';

const path = 'res/photon_data.db';
const database = new sqlite3.Database(path, (error) => {
    if (error) {
        // tslint:disable-next-line:no-console
        console.log(error);
    } else {
        database.run('PRAGMA foreign_keys = ON;');
    }
});

// bind解决单独调用query时this不正确的问题
const queryMethods = {
    select: database.all.bind(database),
    update: database.run.bind(database),
    delete: database.run.bind(database),
    insert: database.run.bind(database)
};

export function executeQuery(sqlStr: string, values?: {} | any[]) {

    const query = queryMethods[sqlStr.trim().substring(0, 6).toLowerCase()];

    return new Promise<any[]>((resolve, reject) => {
        const callback = (err: Error, rows?: any[]) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows); // run成功时rows为undefined
            }
        };

        if (values) {
            query(sqlStr, values, callback); // values会自动被sql转义，避免sql注入攻击
        } else {
            query(sqlStr, callback);
        }
    });
}
