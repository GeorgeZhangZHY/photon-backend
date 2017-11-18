import { executeQuery } from '../utils/sqliteUtils';

export default function fetchAllCostOptions(): Promise<any[]> {
    const sqlStr = 'SELECT coption as costOption FROM cost_options';
    return <Promise<any[]>>executeQuery(sqlStr);
}