import { executeQuery } from '../utils/sqliteUtils';

export default function fetchAllGenders(): Promise<any[]> {
    const sqlStr = 'SELECT gid AS code, gname as name FROM genders';
    return <Promise<any[]>>executeQuery(sqlStr);
}