import { insertData, executeQuery, deleteData, updateData, checkExist } from '../utils/sqliteUtils';
import { mapKeys } from '../utils/objectUtils';
import { UserBriefInfo } from './users';
import { globalMap } from '../config/globalMap';

type NewLike = {
    userId: number,
    albumId: number
};

type Like = NewLike & UserBriefInfo & {
    createTime: string
};

type LikeNotification = Like & {
    albumName: string
};

const objectToDataMap = globalMap;

export function addNewLike(newLike: NewLike) {
    const newLikeData = mapKeys(newLike, objectToDataMap);
    return insertData('likes', newLikeData);
}

export function getLikesOfAlbum(albumId: number): Promise<Like[]> {
    const sqlStr = `SELECT l.*, u.uname, u.avatar_url, u.gender, u.identity, u.rid, r.rname
                    FROM likes l
                        LEFT JOIN users u ON l.uid = u.uid
                        LEFT JOIN regions r ON u.rid = r.rid
                    WHERE l.aid = ?
                    ORDER BY l.create_time ASC`;
    return executeQuery(sqlStr, [albumId])
        .then(rows => (<any[]>rows).map(row => <Like>mapKeys(row, objectToDataMap, true)));
}

export function cancelLike(userId: number, albumId: number) {
    return deleteData('likes', { uid: userId, aid: albumId });
}

/**
 * 获得一个用户的所有未读喜欢通知
 * @param userId 相册主人的id
 */
export function getUnreadLikes(userId: number): Promise<LikeNotification[]> {
    const sqlStr = `SELECT l.*, a.aname, u.uname, u.avatar_url, u.gender, u.identity, u.rid, r.rname
                    FROM likes l
                        JOIN users u ON l.uid = u.uid
                        JOIN albums a ON l.aid = a.aid
                        LEFT JOIN regions r ON u.rid = r.rid
                    WHERE a.uid = ? AND l.has_read = 0
                    ORDER BY l.create_time DESC`;
    return executeQuery(sqlStr, [userId])
        .then(rows => (<any[]>rows).map(row => <LikeNotification>mapKeys(row, objectToDataMap, true)));
}

/**
 * 将某个喜欢通知设为已读
 * @param likerId 点喜欢的用户id
 * @param albumId 
 */
export function setLikeRead(likerId: number, albumId: number) {
    const data = {
        uid: likerId,
        aid: albumId,
        has_read: 1
    };
    return updateData('likes', ['aid', 'uid'], data);
}

// 查询是否已对某个相册点了喜欢
export function checkLike(userId: number, albumId: number): Promise<{ hasLiked: boolean }> {
    return checkExist('likes', {
        uid: userId,
        aid: albumId
    }).then(result => ({
        hasLiked: result
    }));
}