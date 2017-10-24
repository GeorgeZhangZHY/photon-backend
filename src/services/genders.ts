import { executeQuery } from '../utils/sqliteUtils';

export default function fetchGenders(): Promise<any[]> {
    const sqlStr = 'SELECT gid AS code, gname as name FROM genders';
    return <Promise<any[]>>executeQuery(sqlStr);
}