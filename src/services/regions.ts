import { createQuery } from '../utils/mysqlUtils';

export default function fetchRegions(): Promise<{}> {
    const queryStr = 'SELECT rid AS code, rname as name FROM regions';
    return createQuery(queryStr);
}
