import * as sqlite3 from 'sqlite3';
import { getKeysAndValues } from './objectUtils';

const path = 'res/photon_data.db';
const database = new sqlite3.Database(path, (error) => {
    if (error) {
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

/**
 * 以单一属性作为主键，更新数据库中的数据
 * @param tableName 要更新的表名
 * @param primaryKeyNames 主键名数组，用于唯一标识某条数据
 * @param dataObject 更新数据，其中含有主键及其值
 */
export function updateData(tableName: string, primaryKeyNames: string[], dataObject: {}) {
    const primaryValues = primaryKeyNames.map(key => {
        const value = dataObject[key];
        delete dataObject[key];
        return value;
    });
    const { keys, values } = getKeysAndValues(dataObject);
    values.push(...primaryValues);
    const sqlStr = `UPDATE ${tableName} 
                    SET ${keys.map(key => key + ' = ?').join(', ')} 
                    WHERE ${primaryKeyNames.map(name => name + ' = ?').join(' AND ')}`;  // 该库‘=’前不可以用占位符
    return <Promise<void>>executeQuery(sqlStr, values);
}

export function deleteData(tableName: string, conditions: {}) {
    const { keys, values } = getKeysAndValues(conditions);
    const sqlStr = `DELETE FROM ${tableName}
                    WHERE ${keys.map(key => key + ' = ?').join(' AND ')}`;
    return <Promise<void>>executeQuery(sqlStr, values);
}

export function insertData(tableName: string, dataObject: {}) {
    const { keys, values } = getKeysAndValues(dataObject);
    const sqlStr = `INSERT INTO ${tableName} (${keys.join(', ')})
                    VALUES(${keys.map(() => '?').join(', ')})`;

    return <Promise<void>>executeQuery(sqlStr, values);
}

export function executeQuery(sqlStr: string, values?: any[]) {

    const query = queryMethods[sqlStr.trim().substring(0, 6).toLowerCase()];

    return new Promise<any[] | void>((resolve, reject) => {
        const callback = function (err: Error, rows?: any[]) {
            if (err) {
                reject(err);
            } else {
                resolve(rows); // rows只对SELECT语句有效，其余语句为undefined
            }
        };

        if (values) {
            query(sqlStr, values, callback); // values会自动被sql转义，避免sql注入攻击
        } else {
            query(sqlStr, callback);
        }
    }).catch(err => {
        console.log(err);
        throw err;
    });
}
