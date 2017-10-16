import { executeQuery } from '../utils/mysqlUtils';

export default function fetchIdentities(): Promise<{}> {
    const sqlStr = 'SELECT iid AS code, iname as name FROM identities';
    return executeQuery(sqlStr);
}