import { executeQuery, insertData, updateData, deleteData } from '../utils/sqliteUtils';
import { mapKeys } from '../utils/objectUtils';
import { convertDataToImage, deleteImage } from '../utils/imageUtils';

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
    postId: 'pid',
    requestNum: 'rnum'
};

function savePostPhoto(postId: number, dataUrl: string, photoIndex: number): Promise<string> {
    const path = `./public/postPhotos/p${postId}-${photoIndex}.png`;
    return convertDataToImage(dataUrl, path).then(() => path);
}

// 比较客户端传来的url和服务器已有的url，从而确定应该删除哪些图片，新增哪些图片
function diffPhotoUrls(oldUrls: string[], newUrls: string[]) {
    let dataUrlsToAdd = newUrls.filter(newUrl => newUrl.search(/^data:image\/\w+;base64,/) !== -1);   // 为dataUrl
    let urlsToDelete = oldUrls.filter(oldUrl => newUrls.findIndex(newUrl => newUrl === oldUrl) === -1);
    return { dataUrlsToAdd, urlsToDelete };
}

// 获取某个帖子里已有的照片url的最大的后缀序号, 没有照片时返回-1
function getMaxPhotoIndex(photoUrls: string[]): number {
    return photoUrls
        .map(url => +(<string[]>url.match(/\d+.png$/))[0].split('.')[0])
        .reduce((accu, next) => accu > next ? accu : next, -1);
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
                let postTagsData = tagCodes.map(tagCode => ({
                    pid,
                    tagid: tagCode
                }));
                insertTags = Promise.all(postTagsData.map(tag => insertData('post_tags', tag)));
            }

            if (photoUrls.length > 0) {
                let postPhotoUrlsData: {}[] = [];
                insertPhotoUrls = Promise.all(photoUrls.map((dataUrl, index) =>
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

            return Promise.all([<Promise<void[]>>insertTags, <Promise<void[]>>insertPhotoUrls]);
        });

    });

}

export function getPost(postId: number): Promise<Post>{
    const sqlStr = `SELECT p.*, t.tname, t.cover_url, u.uname, u.iid, u.gid, ifnull(r.rnum, 0) as rnum
                    FROM posts p LEFT OUTER JOIN themes t ON p.tid = t.tid JOIN users u ON p.uid = u.uid
                    LEFT OUTER JOIN (
                        SELECT pid, count(*) AS rnum FROM requests
                        GROUP BY pid ) r ON p.pid = r.pid
                    WHERE p.pid = ?`;
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
        dataList = <any[]>rows;
        return Promise.all(dataList.map(row => {
            return Promise.all([
                executeQuery('SELECT tagid FROM post_tags WHERE pid = ?', [row.pid]).then(tags => {
                    row.tagids = (<any[]>tags).map(tag => tag.tagid);
                }), // 获取帖子对应的所有标签
                executeQuery('SELECT photo_url FROM post_photo_urls WHERE pid = ?', [row.pid]).then(photoUrls => {
                    row.photo_urls = (<any[]>photoUrls).map(url => url.photo_url);
                })  // 获取帖子的图片
            ]);
        }));
    }).then(() => <Post[]>dataList.map(data => mapKeys(data, objectToDataMap, true)));
}

export function closePost(pid: number) {
    const sqlStr = 'UPDATE posts SET is_closed = 1 WHERE pid = ?';
    return executeQuery(sqlStr, [pid]);
}

export function modifyPost(modifiedPost: Post) {
    // 单独更新图片和标签
    let { photoUrls, tagCodes } = modifiedPost;

    const pid = modifiedPost.postId;
    delete modifiedPost.photoUrls;
    delete modifiedPost.tagCodes;

    // 删除其他非post表的属性
    delete modifiedPost.ownerGenderCode;
    delete modifiedPost.ownerIdentityCode;
    delete modifiedPost.ownerName;
    delete modifiedPost.themeName;
    delete modifiedPost.themeCoverUrl;
    delete modifiedPost.requestNum;

    // 更新标签
    const postTagsData = tagCodes.map(tagCode => ({
        pid,
        tagid: tagCode
    }));
    const updateTags = deleteData('post_tags', { pid }).then(() =>
        Promise.all(postTagsData.map(tag => insertData('post_tags', tag)))
    );

    // 更新图片
    const updatePhotos = executeQuery('SELECT photo_url as photoUrl FROM post_photo_urls WHERE pid = ?', [pid])
        .then(rows => {
            let oldUrls: string[] = (<any[]>rows).map(row => row.photoUrl);
            const maxOldIndex = getMaxPhotoIndex(oldUrls);
            const { dataUrlsToAdd, urlsToDelete } = diffPhotoUrls(oldUrls, photoUrls);
            const deleteUnwanted = Promise.all(urlsToDelete.map(url => deleteImage(url).then(() =>
                deleteData('post_photo_urls', { pid, photo_url: url })
            )));
            const addNew = Promise.all(dataUrlsToAdd.map(
                (dataUrl, index) => savePostPhoto(pid, dataUrl, maxOldIndex + index + 1).then(newUrl =>
                    insertData('post_photo_urls', {
                        pid,
                        photo_url: newUrl
                    })
                )
            ));
            return Promise.all([deleteUnwanted, addNew]);
        });

    // 更新单值属性
    return Promise.all([updateTags, updatePhotos]).then(() => {
        const modifiedPostData = mapKeys(modifiedPost, objectToDataMap);
        return updateData('posts', 'pid', modifiedPostData);
    });
}