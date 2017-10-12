import fetchRegions from './region';
import * as express from 'express';

const app = express();

// 不要promisify app.get，参见https://stackoverflow.com/questions/24795911/how-to-promisify-nodejs-express-with-bluebird
app.get('/', (req, res) => {
    res.send('Hello, world!');
});

app.get('/regions', (req, res) => {
    fetchRegions().then(result => {
        res.send(result);
    }).catch(err => {
        throw err;
    });
});

const server = app.listen(8080, () => {
    const address = server.address();
    // tslint:disable-next-line:no-console
    console.log(`server running at http://${address.address}:${address.port}`);
});