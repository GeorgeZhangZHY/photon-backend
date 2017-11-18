import { executeQuery, deleteData, insertData } from '../utils/sqliteUtils';

export default function fetchAllTags(): Promise<any[]> {
    const sqlStr = 'SELECT * FROM tags';
    return <Promise<any[]>>executeQuery(sqlStr);
}

/**
 * 批量替换某个表中的标签，若原来没有数据，则直接插入
 * @param keyName 该多值属性属于原有表的属性名，如'pid','aid'等
 * @param keyValue 属性值
 */
export function updateTags(tableName: string, newTags: string[], keyName: string, keyValue: number) {
    // 更新标签
    const tagsData = newTags.map(tag => ({
        [keyName]: keyValue,
        tag
    }));
    return deleteData(tableName, { [keyName]: keyValue }).then(() =>
        Promise.all(tagsData.map(tag => insertData(tableName, tag)))
    );
}

/**
 * 获取某个表中某个id下的所有标签
 * @param tableName 表名
 * @param keyName id属性名
 * @param keyValue id值
 */
export function getTags(tableName: string, keyName: string, keyValue: number): Promise<string[]> {
    return executeQuery(`SELECT tag FROM ${tableName} WHERE ${keyName} = ?`, [keyValue])
        .then(rows => (<any[]>rows).map(row => <string>row.tag));
}