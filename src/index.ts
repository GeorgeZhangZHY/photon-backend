import * as express from 'express';
import * as bodyParser from 'body-parser';
import { Response } from 'express';
import { expressSessionHandler } from './utils/sessionUtils';
import fetchAllRegions from './services/regions';
import fetchAllCostOptions from './services/costOptions';
import fetchAllIdentities from './services/identities';
import fetchAllGenders from './services/genders';
import fetchAllTags from './services/tags';
import { addNewPost, getLatestPosts, modifyPost, getPost, closePost } from './services/posts';
import { addNewUser, configuredPassport, modifyUserInfo, modifyAvatar, modifyQRCode } from './services/users';
import { addNewRequest, getOwnRequests, getOthersRequests } from './services/requests';
import { addNewComment, deleteComment, getComments } from './services/comments';

const app = express();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(expressSessionHandler);
app.use(configuredPassport.initialize());
app.use(configuredPassport.session());

const permittedOrigin = 'http://localhost:3000';

function respondDataFetch(asyncData: Promise<{} | Array<any>>, res: Response) {
    asyncData.then(data => {
        res.setHeader('Access-Control-Allow-Origin', permittedOrigin);
        res.send(data);
    }).catch(err => {
        res.sendStatus(500);
    });
}

function respondAction(asyncResult: Promise<any>, res: Response) {
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
    respondDataFetch(fetchAllRegions(), res);
});

app.get('/costOptions', (req, res) => {
    respondDataFetch(fetchAllCostOptions(), res);
});

app.get('/identities', (req, res) => {
    respondDataFetch(fetchAllIdentities(), res);
});

app.get('/genders', (req, res) => {
    respondDataFetch(fetchAllGenders(), res);
});

app.get('/tags', (req, res) => {
    respondDataFetch(fetchAllTags(), res);
});

// app.get('/users/:userId', (req, res) => {
//     let { userId } = req.params;
//     respondDataFetch(getUser(+userId), res);
// });

app.post('/users', (req, res) => {
    respondAction(addNewUser(req.body), res);
});

app.put('/users', (req, res) => {
    respondAction(modifyUserInfo(req.body), res);
});

app.put('/users/avatars', (req, res) => {
    const { id, imageData } = req.body;
    respondAction(modifyAvatar(id, imageData), res);
});

app.put('/users/qrcodes', (req, res) => {
    const { id, imageData } = req.body;
    respondAction(modifyQRCode(id, imageData), res);
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
    respondDataFetch(getLatestPosts(pageNum, pageSize), res);
});

app.get('/posts/:postId', (req, res) => {
    let { postId } = req.params;
    respondDataFetch(getPost(+postId), res);
});

app.delete('/posts/:postId', (req, res) => {
    let { postId } = req.params;
    respondAction(closePost(+postId), res);
});

app.post('/posts', (req, res) => {
    respondAction(addNewPost(req.body), res);
});

app.put('/posts', (req, res) => {
    respondAction(modifyPost(req.body), res);
});

app.post('/requests', (req, res) => {
    respondAction(addNewRequest(req.body), res);
});

app.get('/requests/own/:requesterId', (req, res) => {
    let { requesterId } = req.params;
    respondDataFetch(getOwnRequests(+requesterId), res);
});

app.get('/requests/others/:userId', (req, res) => {
    let { userId } = req.params;
    respondDataFetch(getOthersRequests(+userId), res);
});

app.post('/comments', (req, res) => {
    respondAction(addNewComment(req.body), res);
});

app.get('/comments/:albumId', (req, res) => {
    let { albumId } = req.params;
    respondDataFetch(getComments(+albumId), res);
});

app.delete('/comments/:albumId', (req, res) => {
    let { albumId } = req.params;
    respondAction(deleteComment(+albumId), res);
});

const server = app.listen(8080, () => {
    const address = server.address();
    console.log(`server running at http://${address.address}:${address.port}`);
});