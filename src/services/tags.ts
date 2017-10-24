import { executeQuery } from '../utils/sqliteUtils';

export default function fetchTags(): Promise<any[]> {
    const sqlStr = 'SELECT tagid AS code, tagname as name FROM tags';
    return <Promise<any[]>>executeQuery(sqlStr);
}