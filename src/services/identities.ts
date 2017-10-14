import { createQuery } from '../utils/mysqlUtils';

export default function fetchIdentities(): Promise<{}> {
    const queryStr = 'SELECT iid AS code, iname as name FROM identities';
    return createQuery(queryStr);
}