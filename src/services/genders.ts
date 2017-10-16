import { executeQuery } from '../utils/mysqlUtils';

export default function fetchGenders(): Promise<{}> {
    const sqlStr = 'SELECT gid AS code, gname as name FROM genders';
    return executeQuery(sqlStr);
}