import { executeQuery, insertData } from '../utils/sqliteUtils';
import { mapKeys } from '../utils/objectUtils';
import { convertDataToImage } from '../utils/imageUtils';

type NewPost = {
    ownerId: number,
    requiredRegionCode: number,
    costOptionCode: number,
    cost: number,
    content: string,
    tagCodes?: number[],
    photoDataUrls?: string[],
    themeId?: number
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
    photoUrls: string[]
} & NewPost;

const objectToDataMap = {
    ownerName: 'uname',
    ownerIdentityCode: 'iid',
    ownerGenderCode: 'gid',
    launchTime: 'launch_time',
    isClosed: 'is_closed',
    themeName: 'tname',
    themeCoverUrl: 'cover_url',
    ownerId: 'uid',
    requiredRegionCode: 'rid',
    costOptionCode: 'cid',
    cost: 'cost',
    content: 'content',
    tagCodes: 'tagids',
    photoUrls: 'photo_urls',
    themeId: 'tid',
    postId: 'pid'
};

function savePostPhoto(postId: number, dataUrl: string, photoIndex: number) {
    const path = `./public/postPhotos/p${postId}-${photoIndex}.png`;
    return convertDataToImage(dataUrl, path)
        .then(() => path)
        .catch(err => {
            console.log(err);
            throw err;
        });
}

// 需要将帖子本身的内容、帖子的图片、帖子的标签分别存到不同的表
export function addNewPost(newPost: NewPost) {

    return executeQuery('SELECT max(pid) as max FROM posts').then(rows => {
        const pid: number = rows[0].max + 1;
        // 转存多值属性至独立的表
        let { photoDataUrls, tagCodes } = newPost;
        let postPhotoUrlsData: {}[] = [], postTagsData = [];

        delete newPost.tagCodes;
        delete newPost.photoDataUrls;
        const newPostData = mapKeys(newPost, objectToDataMap);

        return insertData('posts', newPostData).then(() => {

            let insertTags = undefined, insertPhotoUrls = undefined;

            if (tagCodes) {
                postTagsData = tagCodes.map(tagCode => ({
                    pid,
                    tagid: tagCode
                }));
                insertTags = Promise.all(postTagsData.map(tag => insertData('post_tags', tag)));
            }

            if (photoDataUrls) {
                insertPhotoUrls = Promise.all(photoDataUrls.map((dataUrl, index) =>
                    // 读取所有图片    
                    savePostPhoto(pid, dataUrl, index).then(path => {
                        postPhotoUrlsData.push({
                            pid,
                            photo_url: path
                        });
                    })
                )).then(() => {
                    // 更新数据库表
                    return Promise.all(postPhotoUrlsData.map(photoUrl => insertData('post_photo_urls', photoUrl)));
                });
            }

            return Promise.all([<Promise<number[]>>insertTags, <Promise<number[]>>insertPhotoUrls]);
        });

    });

}

// pageNum从0开始
export function getLatestPosts(pageNum: number, pageSize: number): Promise<Post[]> {

    let dataList: any[];
    // 获取非多值信息
    const mainSqlStr = `SELECT p.*, t.tname, t.cover_url, u.uname, u.iid, u.gid
                    FROM posts p LEFT OUTER JOIN themes t ON p.tid = t.tid JOIN users u ON p.uid = u.uid
                    ORDER BY p.launch_time DESC LIMIT ? OFFSET ?`;
    return executeQuery(mainSqlStr, [pageSize, pageNum * pageSize]).then(rows => {
        dataList = <any[]>rows;
        return Promise.all(dataList.map(row => {
            return Promise.all([
                executeQuery('SELECT tagid FROM post_tags WHERE pid=?', [row.pid]).then(tags => {
                    row.tagids = (<any[]>tags).map(tag => tag.tagid);
                }), // 获取帖子对应的所有标签
                executeQuery('SELECT photo_url FROM post_photo_urls WHERE pid=?', [row.pid]).then(photoUrls => {
                    row.photo_urls = (<any[]>photoUrls).map(url => url.photo_url);
                })  // 获取帖子的图片
            ]);
        }));
    }).then(() => <Post[]>dataList.map(data => mapKeys(data, objectToDataMap, true)));
}