import { executeQuery } from '../utils/sqliteUtils';

export default function fetchCostOptions(): Promise<{}> {
    const sqlStr = 'SELECT cid AS code, cname as name FROM cost_options';
    return executeQuery(sqlStr);
}