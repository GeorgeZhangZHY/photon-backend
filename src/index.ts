import * as express from 'express';
import * as bodyParser from 'body-parser';
import { Response } from 'express';
import { expressSessionHandler } from './utils/sessionUtils';
import fetchRegions from './services/regions';
import fetchCostOptions from './services/costOptions';
import fetchIdentities from './services/identities';
import fetchGenders from './services/genders';
import fetchTags from './services/tags';
import { addNewPost, getLatestPosts } from './services/posts';
import { addNewUser, configuredPassport, modifyUserInfo, modifyAvatar, modifyQRCode } from './services/users';

const app = express();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(expressSessionHandler);
app.use(configuredPassport.initialize());
app.use(configuredPassport.session());

const permittedOrigin = 'http://localhost:3000';

function respondGet(asyncData: Promise<{} | Array<any>>, res: Response) {
    asyncData.then(data => {
        res.setHeader('Access-Control-Allow-Origin', permittedOrigin);
        res.send(data);
    }).catch(err => {
        res.sendStatus(500);
    });
}

function respondWithoutData(asyncResult: Promise<any>, res: Response) {
    asyncResult.then(() => {
        res.sendStatus(200);
    }).catch(err => {
        if (err.code === 'SQLITE_CONSTRAINT') {
            res.sendStatus(400);
        } else {
            res.sendStatus(500);
        }
    });
}

// 不要promisify app.get，参见https://stackoverflow.com/questions/24795911/how-to-promisify-nodejs-express-with-bluebird
app.get('/', (req, res) => {
    res.send('Hello, world!');
});

app.get('/regions', (req, res) => {
    respondGet(fetchRegions(), res);
});

app.get('/costOptions', (req, res) => {
    respondGet(fetchCostOptions(), res);
});

app.get('/identities', (req, res) => {
    respondGet(fetchIdentities(), res);
});

app.get('/genders', (req, res) => {
    respondGet(fetchGenders(), res);
});

app.get('/tags', (req, res) => {
    respondGet(fetchTags(), res);
});

app.post('/users', (req, res) => {
    respondWithoutData(addNewUser(req.body), res);
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

app.get('/posts', (req, res) => {
    let { pageNum, pageSize } = req.query;  // query中的是字符串
    pageNum = Number(pageNum);
    pageSize = Number(pageSize);
    respondGet(getLatestPosts(pageNum, pageSize), res);
});

app.post('/posts', (req, res) => {
    respondWithoutData(addNewPost(req.body), res);
});

const server = app.listen(8080, () => {
    const address = server.address();
    console.log(`server running at http://${address.address}:${address.port}`);
});