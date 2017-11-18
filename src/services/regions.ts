import { executeQuery } from '../utils/sqliteUtils';

export default function fetchAllRegions(): Promise<any[]> {
    const sqlStr = 'SELECT rid AS regionCode, rname AS regionName FROM regions';
    return <Promise<any[]>>executeQuery(sqlStr);
}
