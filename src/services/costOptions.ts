import { createQuery } from '../utils/mysqlUtils';

export default function fetchCostOptions(): Promise<{}> {
    const queryStr = 'SELECT cid AS code, cname as name FROM cost_options';
    return createQuery(queryStr);
}