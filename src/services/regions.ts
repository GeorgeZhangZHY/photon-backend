import { executeQuery } from '../utils/mysqlUtils';

export default function fetchRegions(): Promise<{}> {
    const sqlStr = 'SELECT rid AS code, rname as name FROM regions';
    return executeQuery(sqlStr);
}
