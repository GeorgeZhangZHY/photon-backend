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
import {
    addNewUser, configuredPassport, modifyUserInfo, modifyAvatar, modifyQRCode, getUserBriefInfo
} from './services/users';
import { addNewComment, deleteComment, getComments, getUnreadComments, setCommentRead } from './services/comments';
import { addNewLike, cancelLike, getLikesOfAlbum, getUnreadLikes, setLikeRead } from './services/likes';
import {
    addNewRequest, getOthersRequests, getOwnRequests, getUnreadOthersRequests, setRequestRead
} from './services/requests';
import {
    addNewFollow, cancelFollow, getFollowedUsers, getFollowers, getUnreadFollows, setFollowRead
} from './services/follows';
import { addNewAlbum, getLatestAlbums, getLikedAlbums, modifyAlbum, getUserAlbums } from './services/albums';
import {
    addNewParticipateRequest, getParticipants, getParticipateRequests,
    getParticipateResults, resolveParticipate, setParticipateResultRead
} from './services/participates';

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

app.get('/users/:userId', (req, res) => {
    let { userId } = req.params;
    respondDataFetch(getUserBriefInfo(+userId), res);
});

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
    respondDataFetch(getLatestPosts(+pageNum, +pageSize), res);
});

app.get('/posts/:postId', (req, res) => {
    let { postId } = req.params;    // params中的值是字符串
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

app.get('/requests/others/all/:userId', (req, res) => {
    let { userId } = req.params;
    let { pageNum, pageSize } = req.query;
    respondDataFetch(getOthersRequests(+userId, +pageNum, +pageSize), res);
});

app.get('/requests/others/unread/:userId', (req, res) => {
    let { userId } = req.params;
    respondDataFetch(getUnreadOthersRequests(+userId), res);
});

app.put('/requests/others/read', (req, res) => {
    let { userId, postId } = req.query;
    respondAction(setRequestRead(+userId, +postId), res);
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

app.get('/comments/unread/:userId', (req, res) => {
    let { userId } = req.params;
    respondDataFetch(getUnreadComments(+userId), res);
});

app.put('/comments/read/:commentId', (req, res) => {
    let { commentId } = req.params;
    respondAction(setCommentRead(+commentId), res);
});

app.get('/likes/album/:albumId', (req, res) => {
    let { albumId } = req.params;
    respondDataFetch(getLikesOfAlbum(+albumId), res);
});

app.get('/likes/unread/:userId', (req, res) => {
    let { userId } = req.params;
    respondDataFetch(getUnreadLikes(+userId), res);
});

app.put('/likes/read', (req, res) => {
    let { userId, albumId } = req.query;
    respondAction(setLikeRead(+userId, +albumId), res);
});

app.post('/likes', (req, res) => {
    respondAction(addNewLike(req.body), res);
});

app.delete('/likes', (req, res) => {
    let { userId, albumId } = req.query;
    respondAction(cancelLike(+userId, +albumId), res);
});

app.post('/follows', (req, res) => {
    respondAction(addNewFollow(req.body), res);
});

app.delete('/follows', (req, res) => {
    let { userId, followerId } = req.query;
    respondAction(cancelFollow(+userId, +followerId), res);
});

app.get('/follows/followed', (req, res) => {
    let { followerId, pageNum, pageSize } = req.query;
    respondDataFetch(getFollowedUsers(+followerId, +pageNum, +pageSize), res);
});

app.get('/follows/follower', (req, res) => {
    let { userId, pageNum, pageSize } = req.query;
    respondDataFetch(getFollowers(+userId, +pageNum, +pageSize), res);
});

app.get('/follows/unread/:userId', (req, res) => {
    let { userId } = req.params;
    respondDataFetch(getUnreadFollows(+userId), res);
});

app.put('/follows/read', (req, res) => {
    let { userId, followerId } = req.query;
    respondAction(setFollowRead(+userId, +followerId), res);
});

app.post('/albums', (req, res) => {
    respondAction(addNewAlbum(req.body), res);
});

app.get('/albums/:userId', (req, res) => {
    let { userId } = req.params;
    let { pageNum, pageSize } = req.query;
    respondDataFetch(getUserAlbums(+userId, +pageNum, +pageSize), res);
});

app.get('/albums', (req, res) => {
    let { pageNum, pageSize } = req.query;
    respondDataFetch(getLatestAlbums(+pageNum, +pageSize), res);
});

app.get('/albums/liked', (req, res) => {
    let { userId, pageNum, pageSize } = req.query;
    respondDataFetch(getLikedAlbums(+userId, +pageNum, +pageSize), res);
});

app.put('/albums', (req, res) => {
    respondAction(modifyAlbum(req.body), res);
});

app.post('/participates', (req, res) => {
    respondAction(addNewParticipateRequest(req.body), res);
});

app.get('/participates/:albumId', (req, res) => {
    let { albumId } = req.params;
    respondDataFetch(getParticipants(+albumId), res);
});

app.get('/participates/request/:userId', (req, res) => {
    let { userId } = req.params;
    respondDataFetch(getParticipateRequests(+userId), res);
});

app.get('/participates/result/:requesterId', (req, res) => {
    let { requesterId } = req.params;
    respondDataFetch(getParticipateResults(+requesterId), res);
});

app.put('/participates', (req, res) => {
    let { albumId, userId, agreed } = req.body;
    respondAction(resolveParticipate(albumId, userId, agreed), res);
});

app.put('/participates/result', (req, res) => {
    let { albumId, userId, prevStatus } = req.body;
    respondAction(setParticipateResultRead(albumId, userId, prevStatus), res);
});

const server = app.listen(8080, () => {
    const address = server.address();
    console.log(`server running at http://${address.address}:${address.port}`);
});