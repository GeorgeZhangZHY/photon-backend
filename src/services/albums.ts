import { insertData, executeQuery } from '../utils/sqliteUtils';
import { mapKeys } from '../utils/objectUtils';

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
    coverUrl: string
};

type Album = {
    albumId: number,
    themeName: string,
    themeCoverUrl: string
} & NewAlbum;

const ObjectToDataMap = {
    themeId: 'tid',
    albumName: 'aname',
    albumId: 'aid',
    userId: 'uid',
    shotTime: 'shot_time',
    shotLocation: 'shot_location',
    shotDevice: 'shot_device',
    description: 'description',
    photoUrls: 'photo_urls',
    tagCodes: 'tagids',
    coverUrl: 'cover_url'
};

export function addNewAlbum(newAlbum: NewAlbum) {
    // 
}