import { executeQuery } from '../utils/sqliteUtils';

export default function fetchAllRegions(): Promise<any[]> {
    const sqlStr = 'SELECT rid AS code, rname as name FROM regions';
    return <Promise<any[]>>executeQuery(sqlStr);
}
