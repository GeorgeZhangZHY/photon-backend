import { insertData, executeQuery, deleteData } from '../utils/sqliteUtils';
import { mapKeys } from '../utils/objectUtils';

type NewLike = {
    userId: number,
    albumId: number
};

type Like = {
    userName: string,
    userAvatarUrl: string,
    createTime: string
} & NewLike;

const objectToDataMap = {
    userId: 'uid',
    userName: 'uname',
    userAvatarUrl: 'avatar_url',
    albumId: 'aid',
    createTime: 'create_time'
};

export function addNewLike(newLike: NewLike) {
    const newLikeData = mapKeys(newLike, objectToDataMap);
    return insertData('likes', newLikeData);
}

export function getLikesOfAlbum(albumId: number): Promise<Like[]> {
    const sqlStr = `SELECT l.*, u.uname, u.avatar_url
                    FROM likes l JOIN users u ON l.uid = u.uid
                    WHERE l.aid = ?`;
    return executeQuery(sqlStr, [albumId])
        .then(rows => (<any[]>rows).map(row => <Like>mapKeys(row, objectToDataMap, true)));
}

export function cancelLike(userId: number, albumId: number) {
    return deleteData('likes', { uid: userId, aid: albumId });
}

/**
 * 
 * @param userId 相册主人的id
 */
export function getUnreadLikes(userId: number): Promise<Like[]> {
    // todo
}

/**
 * 
 * @param userId 点喜欢的用户id
 * @param albumId 
 */
export function setLikeRead(userId: number, albumId: number) {
    // todo
}