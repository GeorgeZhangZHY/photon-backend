import { executeQuery, deleteData, insertData } from '../utils/sqliteUtils';

export default function fetchTags(): Promise<any[]> {
    const sqlStr = 'SELECT tagid AS code, tagname as name FROM tags';
    return <Promise<any[]>>executeQuery(sqlStr);
}

/**
 * 批量替换某个表中的标签，若原来没有数据，则直接插入
 * @param keyName 该多值属性属于原有表的属性名，如'pid','aid'等
 * @param keyValue 属性值
 */
export function updateTags(tableName: string, newTagCodes: number[], keyName: string, keyValue: number) {
    // 更新标签
    const tagsData = newTagCodes.map(tagCode => ({
        [keyName]: keyValue,
        tagid: tagCode
    }));
    return deleteData(tableName, { [keyName]: keyValue }).then(() =>
        Promise.all(tagsData.map(tag => insertData(tableName, tag)))
    );
}