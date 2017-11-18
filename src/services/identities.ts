import { executeQuery } from '../utils/sqliteUtils';

export default function fetchAllIdentities(): Promise<any[]> {
    const sqlStr = 'SELECT * FROM identities';
    return <Promise<any[]>>executeQuery(sqlStr);
}