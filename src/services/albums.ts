import { insertData, executeQuery, updateData, deleteData } from '../utils/sqliteUtils';
import { mapKeys } from '../utils/objectUtils';
import { convertDataToImage } from '../utils/imageUtils';
import { updateTags, getTags } from './tags';
import { updatePhotoUrls, getPhotoUrls } from './photoUrls';
import { globalMap } from '../config/globalMap';

type NewAlbum = {
    albumName: string,
    userId: number,
    shotTime: string,
    shotLocation: string,
    shotDevice: string,
    description: string,
    photoUrls: string[],
    tags: string[],
    coverOrdinal: number    // 封面图片对应于其所有图片中的后缀
};

export type Album = {
    albumId: number,
    createTime: string,
} & NewAlbum;

const objectToDataMap = globalMap;

function saveAlbumPhoto(albumId: number, dataUrl: string, photoIndex: number): Promise<string> {
    const path = `./public/albumPhotos/a${albumId}-${photoIndex}.png`;
    return convertDataToImage(dataUrl, path).then(() => path);
}

// 根据已有的相册信息获取其标签和图片，并将结果附加到传入的对象上
function getAlbumTagsAndUrls(partialAlbumData: { aid: number } & any) {
    return Promise.all([
        getTags('album_tags', 'aid', partialAlbumData.aid).then(tagIds => {
            partialAlbumData.tagids = tagIds;
        }),
        getPhotoUrls('album_photo_urls', 'aid', partialAlbumData.aid).then(photoUrls => {
            partialAlbumData.photo_urls = photoUrls;
        })
    ]);
}

export function getAlbum(albumId: number): Promise<Album> {
    // 单值属性
    const mainSqlStr = `SELECT a.*
                        FROM albums a 
                        WHERE a.aid = ?`;
    let data: any;
    return executeQuery(mainSqlStr, [albumId]).then(rows => {
        // 获取多值属性
        data = rows[0];
        return getAlbumTagsAndUrls(data);
    }).then(() => <Album>mapKeys(data, objectToDataMap, true));
}

export function addNewAlbum(newAlbum: NewAlbum) {
    return executeQuery('SELECT max(aid) as max FROM albums').then(rows => {
        const aid: number = rows[0].max + 1;
        // 转存多值属性至独立的表
        let { photoUrls, tags } = newAlbum;

        delete newAlbum.tags;
        delete newAlbum.photoUrls;
        const newAlbumData = mapKeys(newAlbum, objectToDataMap);

        return insertData('albums', newAlbumData).then(() => {
            let insertTags, insertPhotoUrls;
            if (tags.length > 0) {
                insertTags = updateTags('album_tags', tags, 'aid', aid);
            }
            if (photoUrls.length > 0) {
                insertPhotoUrls = updatePhotoUrls('album_photo_urls', photoUrls, 'aid', aid, saveAlbumPhoto);
            }
            return Promise.all([<Promise<void[]>>insertTags, <Promise<[void[], void[]]>>insertPhotoUrls]);
        });
    });
}

export function modifyAlbum(modifiedAlbum: Album) {
    // 单独更新图片和标签
    let { photoUrls, tags } = modifiedAlbum;
    const aid = modifiedAlbum.albumId;
    delete modifiedAlbum.photoUrls;
    delete modifiedAlbum.tags;

    // 更新标签
    const modifyTags = updateTags('album_tags', tags, 'aid', aid);
    // 更新图片
    const updatePhotos = updatePhotoUrls('album_photo_urls', photoUrls, 'aid', aid, saveAlbumPhoto);
    // 更新单值属性
    return Promise.all([modifyTags, updatePhotos]).then(() => {
        const modifiedAlbumData = mapKeys(modifiedAlbum, objectToDataMap);
        return updateData('albums', ['aid'], modifiedAlbumData);
    });
}

// pageNum从0开始
export function getLatestAlbums(pageNum: number, pageSize: number): Promise<Album[]> {
    const sqlStr = `SELECT aid
                    FROM albums
                    ORDER BY create_time DESC LIMIT ? OFFSET ?`;
    return executeQuery(sqlStr, [pageSize, pageNum * pageSize]).then(rows => {
        return Promise.all((<any[]>rows).map(row => getAlbum(row.aid)));
    });
}

/**
 * 获得一个用户喜欢的相册
 * @param userId 
 * @param pageNum 
 * @param pageSize 
 */
export function getLikedAlbums(userId: number, pageNum: number, pageSize: number): Promise<Album[]> {
    const sqlStr = `SELECT aid
                    FROM likes
                    WHERE uid = ?
                    ORDER BY create_time DESC LIMIT ? OFFSET ?`;
    return executeQuery(sqlStr, [userId, pageSize, pageNum * pageSize]).then(rows => {
        return Promise.all((<any[]>rows).map(row => getAlbum(row.aid)));
    });
}

/**
 * 返回用户自己的相册
 * 
 */
export function getUserAlbums(userId: number, pageNum: number, pageSize: number): Promise<Album[]> {
    const sqlStr = `SELECT aid
                    FROM albums
                    WHERE uid = ?
                    ORDER BY create_time DESC LIMIT ? OFFSET ?`;
    return executeQuery(sqlStr, [userId, pageSize, pageNum * pageSize]).then(rows => {
        return Promise.all((<any[]>rows).map(row => getAlbum(row.aid)));
    });
}

export function deleteAlbum(albumId: number) {
    return deleteData('albums', { aid: albumId });
}