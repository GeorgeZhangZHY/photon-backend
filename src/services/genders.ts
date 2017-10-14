import { createQuery } from '../utils/mysqlUtils';

export default function fetchGenders(): Promise<{}> {
    const queryStr = 'SELECT gid AS code, gname as name FROM genders';
    return createQuery(queryStr);
}