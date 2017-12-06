import { executeQuery, insertData, updateData } from '../utils/sqliteUtils';
import { mapKeys, getKeysAndValues } from '../utils/objectUtils';
import { convertDataToImage } from '../utils/imageUtils';
import { updateTags, getTags } from './tags';
import { updatePhotoUrls, getPhotoUrls } from './photoUrls';
import { createLocalMap } from '../config/globalMap';

type NewPost = {
    ownerId: number,
    requiredRegionCode: number,
    costOption: string,
    cost: number,
    content: string,
    tags: string[],
    photoUrls: string[]   // 对于浏览器端刚上传的图片，为base64编码的dataUrl；对于从服务器发送的图片，则为路径
};

export type Post = {
    postId: number,
    ownerName: string,
    ownerIdentity: number,
    ownerGender: number,
    ownerAvatarUrl: string,
    createTime: string,
    isClosed: boolean,
    requiredRegionName: string,
    requestNum: number  // 收到的约拍请求数
} & NewPost;

type Condition = {
    ownerId?: number,
    costOption?: string,
    ownerGender?: string,
    requiredRegionCode?: number,
    ownerIdentity?: string
};

const objectToDataMap = createLocalMap({
    ownerName: 'uname',
    ownerIdentity: 'identity',
    ownerGender: 'gender',
    ownerId: 'uid',
    requiredRegionCode: 'rid',
    requiredRegionName: 'rname',
    ownerAvatarUrl: 'avatar_url'
});

function savePostPhoto(postId: number, dataUrl: string, photoIndex: number): Promise<string> {
    const path = `./public/postPhotos/p${postId}-${photoIndex}.png`;
    return convertDataToImage(dataUrl, path).then(() => path);
}

// 根据已有的帖子信息获取其标签和图片，并将结果附加到传入的对象上
function getPostTagsAndUrls(partialPostData: { pid: number } & any) {
    return Promise.all([
        // 获取帖子对应的所有标签
        getTags('post_tags', 'pid', partialPostData.pid).then(tags => {
            partialPostData.tags = tags;
        }),
        // 获取帖子的图片
        getPhotoUrls('post_photo_urls', 'pid', partialPostData.pid).then(photoUrls => {
            partialPostData.photo_urls = photoUrls;
        })
    ]);
}

// 需要将帖子本身的内容、帖子的图片、帖子的标签分别存到不同的表
export function addNewPost(newPost: NewPost) {
    return executeQuery('SELECT ifnull(max(pid), 0) as max FROM posts').then(rows => {
        const pid: number = rows[0].max + 1;
        // 转存多值属性至独立的表
        let { photoUrls, tags } = newPost;

        delete newPost.tags;
        delete newPost.photoUrls;
        const newPostData = mapKeys(newPost, objectToDataMap);

        return insertData('posts', newPostData).then(() => {
            let insertTags, insertPhotoUrls;
            if (tags.length > 0) {
                insertTags = updateTags('post_tags', tags, 'pid', pid);
            }
            if (photoUrls.length > 0) {
                insertPhotoUrls = updatePhotoUrls('post_photo_urls', photoUrls, 'pid', pid, savePostPhoto);
            }
            return Promise.all([<Promise<void[]>>insertTags, <Promise<[void[], void[]]>>insertPhotoUrls]);
        });
    });
}

export function getPost(postId: number): Promise<Post> {
    const sqlStr = `SELECT p.*, u.uname, u.identity, u.gender, 
                        u.avatar_url, ifnull(rq.rnum, 0) as rnum, r.rname
                    FROM posts p 
                        LEFT JOIN regions r ON p.rid = r.rid
                        JOIN users u ON p.uid = u.uid
                        LEFT JOIN (
                            SELECT pid, count(*) AS rnum FROM requests
                            GROUP BY pid ) rq ON p.pid = rq.pid
                    WHERE p.pid = ?`;
    return executeQuery(sqlStr, [postId])
        .then(rows => getPostTagsAndUrls(rows[0])
            .then(() => <Post>mapKeys(rows[0], objectToDataMap, true)));
}

// pageNum从0开始
export function getLatestPosts(pageNum: number, pageSize: number, condition?: Condition): Promise<Post[]> {
    let dataList: any[] = [];
    // 设置筛选条件
    let extraSqlStr = '';
    let extraValues = [];
    if (condition) {
        // 若传入字符串，转为数字
        if (condition.ownerId) {
            condition.ownerId = +condition.ownerId;
        }
        if (condition.requiredRegionCode) {
            condition.requiredRegionCode = +condition.requiredRegionCode;
        }
        const conditionMap = {
            ownerId: 'p.uid',
            costOption: 'p.coption',
            ownerGender: 'u.gender',
            requiredRegionCode: 'p.rid',
            ownerIdentity: 'u.identity'
        };
        const keysAndValues = getKeysAndValues(mapKeys(condition, conditionMap));
        extraSqlStr = ' AND ' + keysAndValues.keys.map(key => `${key} = ?`).join(' AND ');
        extraValues = keysAndValues.values;
    }

    // 获取非多值信息
    const mainSqlStr = `SELECT p.*, u.uname, u.identity, u.gender,
                             u.avatar_url, ifnull(rq.rnum, 0) as rnum, r.rname
                        FROM posts p 
                            LEFT JOIN regions r ON p.rid = r.rid
                            JOIN users u ON p.uid = u.uid
                            LEFT JOIN (
                                SELECT pid, count(*) AS rnum FROM requests
                                GROUP BY pid ) rq ON p.pid = rq.pid
                        WHERE p.is_closed = 0 ${extraSqlStr}
                        ORDER BY p.create_time DESC LIMIT ? OFFSET ?`;

    return executeQuery(mainSqlStr, extraValues.concat([pageSize, pageNum * pageSize])).then(rows => {
        // 获取多值信息
        dataList = <any[]>rows;
        return Promise.all(dataList.map(row => getPostTagsAndUrls(row)));
    }).then(() => <Post[]>dataList.map(data => mapKeys(data, objectToDataMap, true)));
}

export function getUserPosts(userId: number, pageNum: number, pageSize: number): Promise<Post[]> {
    return getLatestPosts(pageNum, pageSize, { ownerId: userId });
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
    let { photoUrls, tags } = modifiedPost;

    const pid = modifiedPost.postId;
    delete modifiedPost.photoUrls;
    delete modifiedPost.tags;

    // 删除其他非posts表的属性
    delete modifiedPost.ownerGender;
    delete modifiedPost.ownerIdentity;
    delete modifiedPost.ownerName;
    delete modifiedPost.requestNum;

    // 更新标签
    const modifyTags = updateTags('post_tags', tags, 'pid', pid);
    // 更新图片
    const updatePhotos = updatePhotoUrls('post_photo_urls', photoUrls, 'pid', pid, savePostPhoto);
    // 更新单值属性
    return Promise.all([modifyTags, updatePhotos]).then(() => {
        const modifiedPostData = mapKeys(modifiedPost, objectToDataMap);
        return updateData('posts', ['pid'], modifiedPostData);
    });
}