import { insertData, executeQuery, updateData } from '../utils/sqliteUtils';
import { mapKeys } from '../utils/objectUtils';
import { convertDataToImage } from '../utils/imageUtils';
import { updateTags } from './tags';
import { updatePhotoUrls } from './photoUrls';

type NewAlbum = {
    themeId?: number,
    albumName: string,
    userId: number,
    shotTime: string,
    shotLocation: string,
    shotDevice: string,
    description: string,
    photoUrls: string[],
    tagCodes: number[],
    coverOrdinal: number    // 封面图片对应于其所有图片中的后缀
};

type Album = {
    albumId: number,
    themeName?: string,
    themeCoverUrl?: string
} & NewAlbum;

const objectToDataMap = {
    themeId: 'tid',
    themeName: 'tname',
    themeCoverUrl: 'cover_url',
    albumName: 'aname',
    albumId: 'aid',
    userId: 'uid',
    shotTime: 'shot_time',
    shotLocation: 'shot_location',
    shotDevice: 'shot_device',
    description: 'description',
    photoUrls: 'photo_urls',
    tagCodes: 'tagids',
    coverOrdinal: 'cover_ordinal'
};

function saveAlbumPhoto(albumId: number, dataUrl: string, photoIndex: number): Promise<string> {
    const path = `./public/albumPhotos/a${albumId}-${photoIndex}.png`;
    return convertDataToImage(dataUrl, path).then(() => path);
}

export function addNewAlbum(newAlbum: NewAlbum) {
    return executeQuery('SELECT max(aid) as max FROM albums').then(rows => {
        const aid: number = rows[0].max + 1;
        // 转存多值属性至独立的表
        let { photoUrls, tagCodes } = newAlbum;

        delete newAlbum.tagCodes;
        delete newAlbum.photoUrls;
        const newAlbumData = mapKeys(newAlbum, objectToDataMap);

        return insertData('albums', newAlbumData).then(() => {
            let insertTags, insertPhotoUrls;
            if (tagCodes.length > 0) {
                insertTags = updateTags('album_tags', tagCodes, 'aid', aid);
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
    let { photoUrls, tagCodes } = modifiedAlbum;
    const aid = modifiedAlbum.albumId;
    delete modifiedAlbum.photoUrls;
    delete modifiedAlbum.tagCodes;

    // 删除其他非albums表的属性
    delete modifiedAlbum.themeCoverUrl;
    delete modifiedAlbum.themeName;

    // 更新标签
    const modifyTags = updateTags('album_tags', tagCodes, 'aid', aid);
    // 更新图片
    const updatePhotos = updatePhotoUrls('album_photo_urls', photoUrls, 'aid', aid, saveAlbumPhoto);
    // 更新单值属性
    return Promise.all([modifyTags, updatePhotos]).then(() => {
        const modifiedAlbumData = mapKeys(modifiedAlbum, objectToDataMap);
        return updateData('albums', 'aid', modifiedAlbumData);
    });
}

// pageNum从0开始
export function getLatestAlbums(pageNum: number, pageSize: number): Promise<Album[]> {
    const sqlStr=``
}