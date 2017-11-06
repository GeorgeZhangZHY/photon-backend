import { executeQuery } from '../utils/sqliteUtils';

export default function fetchAllIdentities(): Promise<any[]> {
    const sqlStr = 'SELECT iid AS code, iname as name FROM identities';
    return <Promise<any[]>>executeQuery(sqlStr);
}