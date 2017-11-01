import { executeQuery } from '../utils/sqliteUtils';

export default function fetchCostOptions(): Promise<any[]> {
    const sqlStr = 'SELECT cid AS code, cname as name FROM cost_options';
    return <Promise<any[]>>executeQuery(sqlStr);
}