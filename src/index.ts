import * as express from 'express';
import * as bodyParser from 'body-parser';
import { Response } from 'express';
import { expressSessionHandler } from './utils/sessionUtils';
import fetchRegions from './services/regions';
import fetchCostOptions from './services/costOptions';
import fetchIdentities from './services/identities';
import fetchGenders from './services/genders';
import fetchTags from './services/tags';
import { addNewUser, configuredPassport, modifyUserInfo, modifyAvatar, modifyQRCode } from './services/users';

const app = express();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(expressSessionHandler);
app.use(configuredPassport.initialize());
app.use(configuredPassport.session());

const permittedOrigin = 'http://localhost:3000';

function respondGetWithoutParams(dataFetcher: () => Promise<{} | Array<any>>, res: Response) {
    dataFetcher().then(result => {
        res.setHeader('Access-Control-Allow-Origin', permittedOrigin);
        res.send(result);
    }).catch(err => {
        console.log(err);
        res.sendStatus(500);
    });
}

function respondWithoutData(process: Promise<void>, res: Response) {
    process.then(() => {
        res.sendStatus(200);
    }).catch(err => {
        console.log(err);
        res.sendStatus(500);
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

app.get('/tags', (req, res) => {
    respondGetWithoutParams(fetchTags, res);
});

app.post('/users', (req, res) => {
    const result = addNewUser(req.body);
    if (!result) {
        return res.sendStatus(400);
    }
    return respondWithoutData(result, res);
});

app.put('/users', (req, res) => {
    respondWithoutData(modifyUserInfo(req.body), res);
});

app.put('/users/avatars', (req, res) => {
    const { id, imageData } = req.body;
    respondWithoutData(modifyAvatar(id, imageData), res);
});

app.put('/users/qrcodes', (req, res) => {
    const { id, imageData } = req.body;
    respondWithoutData(modifyQRCode(id, imageData), res);
});

app.post('/login', configuredPassport.authenticate('local'), (req, res) => {
    res.send(req.user);
});

app.get('/logout', (req, res) => {
    req.logout();
    res.sendStatus(200);
});

const server = app.listen(8080, () => {
    const address = server.address();
    console.log(`server running at http://${address.address}:${address.port}`);
});