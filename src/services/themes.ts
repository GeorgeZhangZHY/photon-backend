import { executeQuery, insertData, updateData } from '../utils/sqliteUtils';
import { mapKeys } from '../utils/objectUtils';
import { convertDataToImage } from '../utils/imageUtils';
import { createLocalMap } from '../config/globalMap';

type NewTheme = {
    themeName: string,
    themeDescription: string,
    coverUrl: string,
    creatorId: number
};

type Theme = {
    themeId: number
    createTime: string
    collectNum: number,
    postNum: number,
    creatorAvatarUrl: string
} & NewTheme;

const objectToDataMap = createLocalMap({
    creatorAvatarUrl: 'avatar_url'
});

function saveThemeCover(themeId: number, dataUrl: string): Promise<string> {
    const path = `./public/themeCovers/t${themeId}.png`;
    return convertDataToImage(dataUrl, path).then(() => path);
}

export function addNewTheme(newTheme: NewTheme) {
    return executeQuery('SELECT ifnull(max(tid), 0) as max FROM themes').then(rows => {
        const themeId: number = rows[0].max + 1;
        return saveThemeCover(themeId, newTheme.coverUrl).then(path => {
            newTheme.coverUrl = path;
            return insertData('themes', mapKeys(newTheme, objectToDataMap));
        });
    });
}

// export function getLatestThemes(pageNum: number, pageSize: number): Promise<Theme[]> {
//      const sqlStr = `SELECT t.*, u.avatar_url
//                      FROM themes t JOIN users u ON t.creator_id = u.uid`
// }