import { executeQuery } from '../utils/sqliteUtils';

export default function fetchIdentities(): Promise<{}> {
    const sqlStr = 'SELECT iid AS code, iname as name FROM identities';
    return executeQuery(sqlStr);
}