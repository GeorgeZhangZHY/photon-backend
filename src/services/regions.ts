import { executeQuery } from '../utils/sqliteUtils';

export default function fetchRegions(): Promise<{}> {
    const sqlStr = 'SELECT rid AS code, rname as name FROM regions';
    return executeQuery(sqlStr);
}
