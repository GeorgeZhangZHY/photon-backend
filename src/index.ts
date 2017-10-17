import * as express from 'express';
import * as bodyParser from 'body-parser';
import { Response } from 'express';
import * as expressSession from 'express-session';
import { sessionStore } from './utils/mysqlUtils';
import fetchRegions from './services/regions';
import fetchCostOptions from './services/costOptions';
import fetchIdentities from './services/identities';
import fetchGenders from './services/genders';
import { addNewUser, configuredPassport } from './services/user';

const app = express();

app.use(bodyParser.json());
app.use(expressSession({
    secret: 'GeorgeZhangEgool',
    cookie: { maxAge: 60000 },
    store: sessionStore,
    resave: false,
    saveUninitialized: false
}));
app.use(configuredPassport.initialize());
app.use(configuredPassport.session());

const permittedOrigin = 'http://localhost:3000';

function respondGetWithoutParams(dataFetcher: () => Promise<{}>, res: Response) {
    dataFetcher().then(result => {
        res.setHeader('Access-Control-Allow-Origin', permittedOrigin);
        res.send(result);
    }).catch(err => {
        // tslint:disable-next-line:no-console
        console.log(err);
    });
}

// 不要promisify app.get，参见https://stackoverflow.com/questions/24795911/how-to-promisify-nodejs-express-with-bluebird
app.get('/', (req, res) => {
    res.send('Hello, world!');
});

app.get('/regions', (req, res) => {
    respondGetWithoutParams(fetchRegions, res);
});

app.get('/costOptions', (req, res) => {
    respondGetWithoutParams(fetchCostOptions, res);
});

app.get('/identities', (req, res) => {
    respondGetWithoutParams(fetchIdentities, res);
});

app.get('/genders', (req, res) => {
    respondGetWithoutParams(fetchGenders, res);
});

app.post('/users', (req, res) => {
    const result = addNewUser(req.body);
    if (!result) {
        res.setHeader('status', 400);
        return res.send();
    }
    result.then(() => {
        res.setHeader('status', 200);
        res.send('success');
    }).catch(() => {
        res.setHeader('status', 400);
        res.send();
    });
    return;
});

app.post('/login', configuredPassport.authenticate('local'), (req, res) => {
    res.send(req.user);
});

app.get('/logout', (req, res) => {
    req.logout();
    res.send();
});

const server = app.listen(8080, () => {
    const address = server.address();
    // tslint:disable-next-line:no-console
    console.log(`server running at http://${address.address}:${address.port}`);
});