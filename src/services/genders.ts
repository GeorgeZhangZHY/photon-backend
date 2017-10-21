import { executeQuery } from '../utils/sqliteUtils';

export default function fetchGenders(): Promise<{}> {
    const sqlStr = 'SELECT gid AS code, gname as name FROM genders';
    return executeQuery(sqlStr);
}