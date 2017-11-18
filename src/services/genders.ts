import { executeQuery } from '../utils/sqliteUtils';

export default function fetchAllGenders(): Promise<any[]> {
    const sqlStr = 'SELECT * FROM genders';
    return <Promise<any[]>>executeQuery(sqlStr);
}