import { executeQuery, insertData, updateData } from '../utils/sqliteUtils';
import { mapKeys } from '../utils/objectUtils';
import { convertDataToImage } from '../utils/imageUtils';
import { updateTags, getTags } from './tags';
import { updatePhotoUrls, getPhotoUrls } from './photoUrls';
import { createLocalMap } from '../config/globalMap';

type NewPost = {
    ownerId: number,
    requiredRegionCode: number,
    costOptionCode: number,
    cost: number,
    content: string,
    tagCodes: number[],
    photoUrls: string[],   // 对于浏览器端刚上传的图片，为base64编码的dataUrl；对于从服务器发送的图片，则为路径
    themeId: number
};

type Post = {
    postId: number,
    ownerName: string,
    ownerIdentityCode: number,
    ownerGenderCode: number,
    launchTime: string,
    isClosed: boolean,
    themeName: string,
    themeCoverUrl: string,
    requestNum: number  // 收到的约拍请求数
} & NewPost;

const objectToDataMap = createLocalMap({
    ownerName: 'uname',
    ownerIdentityCode: 'iid',
    ownerGenderCode: 'gid',
    ownerId: 'uid',
    requiredRegionCode: 'rid',
});

function savePostPhoto(postId: number, dataUrl: string, photoIndex: number): Promise<string> {
    const path = `./public/postPhotos/p${postId}-${photoIndex}.png`;
    return convertDataToImage(dataUrl, path).then(() => path);
}

// 根据已有的帖子信息获取其标签和图片，并将结果附加到传入的对象上
function getPostTagsAndUrls(partialPostData: { pid: number } & any) {
    return Promise.all([
        // 获取帖子对应的所有标签
        getTags('post_tags', 'pid', partialPostData.pid).then(tagIds => {
            partialPostData.tagids = tagIds;
        }),
        // 获取帖子的图片
        getPhotoUrls('post_photo_urls', 'pid', partialPostData.pid).then(photoUrls => {
            partialPostData.photo_urls = photoUrls;
        })
    ]);
}

// 需要将帖子本身的内容、帖子的图片、帖子的标签分别存到不同的表
export function addNewPost(newPost: NewPost) {
    return executeQuery('SELECT max(pid) as max FROM posts').then(rows => {
        const pid: number = rows[0].max + 1;
        // 转存多值属性至独立的表
        let { photoUrls, tagCodes } = newPost;

        delete newPost.tagCodes;
        delete newPost.photoUrls;
        const newPostData = mapKeys(newPost, objectToDataMap);

        return insertData('posts', newPostData).then(() => {
            let insertTags, insertPhotoUrls;
            if (tagCodes.length > 0) {
                insertTags = updateTags('post_tags', tagCodes, 'pid', pid);
            }
            if (photoUrls.length > 0) {
                insertPhotoUrls = updatePhotoUrls('post_photo_urls', photoUrls, 'pid', pid, savePostPhoto);
            }
            return Promise.all([<Promise<void[]>>insertTags, <Promise<[void[], void[]]>>insertPhotoUrls]);
        });
    });
}

export function getPost(postId: number): Promise<Post> {
    const sqlStr = `SELECT p.*, t.tname, t.cover_url, u.uname, u.iid, u.gid, ifnull(r.rnum, 0) as rnum
                    FROM posts p LEFT OUTER JOIN themes t ON p.tid = t.tid JOIN users u ON p.uid = u.uid
                    LEFT OUTER JOIN (
                        SELECT pid, count(*) AS rnum FROM requests
                        GROUP BY pid ) r ON p.pid = r.pid
                    WHERE p.pid = ?`;
    return executeQuery(sqlStr, [postId])
        .then(rows => getPostTagsAndUrls(rows[0])
        .then(() => <Post>mapKeys(rows[0], objectToDataMap, true)));
}

// pageNum从0开始
export function getLatestPosts(pageNum: number, pageSize: number): Promise<Post[]> {
    let dataList: any[];
    // 获取非多值信息
    const mainSqlStr = `SELECT p.*, t.tname, t.cover_url, u.uname, u.iid, u.gid, ifnull(r.rnum, 0) as rnum
                        FROM posts p LEFT OUTER JOIN themes t ON p.tid = t.tid JOIN users u ON p.uid = u.uid
                            LEFT OUTER JOIN (
                                SELECT pid, count(*) AS rnum FROM requests
                                GROUP BY pid ) r ON p.pid = r.pid
                        WHERE p.is_closed = 0
                        ORDER BY p.launch_time DESC LIMIT ? OFFSET ?`;

    return executeQuery(mainSqlStr, [pageSize, pageNum * pageSize]).then(rows => {
        // 获取多值信息
        dataList = <any[]>rows;
        return Promise.all(dataList.map(row => getPostTagsAndUrls(row)));
    }).then(() => <Post[]>dataList.map(data => mapKeys(data, objectToDataMap, true)));
}

export function closePost(pid: number) {
    const data = {
        is_closed: 1,
        pid
    };
    return updateData('posts', ['pid'], data);
}

export function modifyPost(modifiedPost: Post) {
    // 单独更新图片和标签
    let { photoUrls, tagCodes } = modifiedPost;

    const pid = modifiedPost.postId;
    delete modifiedPost.photoUrls;
    delete modifiedPost.tagCodes;

    // 删除其他非posts表的属性
    delete modifiedPost.ownerGenderCode;
    delete modifiedPost.ownerIdentityCode;
    delete modifiedPost.ownerName;
    delete modifiedPost.themeName;
    delete modifiedPost.themeCoverUrl;
    delete modifiedPost.requestNum;

    // 更新标签
    const modifyTags = updateTags('post_tags', tagCodes, 'pid', pid);
    // 更新图片
    const updatePhotos = updatePhotoUrls('post_photo_urls', photoUrls, 'pid', pid, savePostPhoto);
    // 更新单值属性
    return Promise.all([modifyTags, updatePhotos]).then(() => {
        const modifiedPostData = mapKeys(modifiedPost, objectToDataMap);
        return updateData('posts', ['pid'], modifiedPostData);
    });
}