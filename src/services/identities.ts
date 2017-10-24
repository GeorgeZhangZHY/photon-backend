import { executeQuery } from '../utils/sqliteUtils';

export default function fetchIdentities(): Promise<any[]> {
    const sqlStr = 'SELECT iid AS code, iname as name FROM identities';
    return <Promise<any[]>>executeQuery(sqlStr);
}