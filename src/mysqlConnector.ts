import * as mysql from 'mysql';

const createConnection = () => mysql.createConnection({
    host: 'localhost',
    user: 'George',
    password: 'Hello, world!',
    database: 'photon_data'
});

export default createConnection;