import { UserBriefInfo, getUserBriefInfo } from './users';
import { Album, getAlbum } from './albums';
import { Post, getPost } from './posts';
import { executeQuery } from '../utils/sqliteUtils';

type Activity = {
    user: UserBriefInfo
    type: 'album' | 'post'
    payload: Album | Post
};

/**
 * 分页获取某个用户关注的所有用户的动态
 * @param userId 作为关注者的用户id
 * @param pageNum 
 * @param pageSize 
 */
export function getFollowedUsersActivities(userId: number, pageNum: number, pageSize: number): Promise<Activity[]> {
    const sqlStr = `SELECT uid
                    FROM follows
                    WHERE follower_id = ?`;
    return executeQuery(sqlStr, [userId]).then(rows => {
        const followedUserIds = (<any[]>rows).map(row => row.uid);
        return getActivities(pageNum, pageSize, followedUserIds);
    });
}

/**
 * 分页获取某个用户的动态
 * @param userId 
 */
export function getSingleUserActivities(userId: number, pageNum: number, pageSize: number): Promise<Activity[]> {
    return getActivities(pageNum, pageSize, [userId]);
}

function getActivities(pageNum: number, pageSize: number, userIds: number[]): Promise<Activity[]> {
    const sqlStr = `SELECT uid, type, entity_id
                    FROM activities
                    WHERE uid IN (${userIds.map(() => '?').join(',')})
                    ORDER BY create_time DESC
                    LIMIT ? OFFSET ?`;
    return Promise.all(userIds.map(userId => getUserBriefInfo(userId))).then(users =>
        executeQuery(sqlStr, [...userIds, pageSize, pageNum * pageSize]).then(rows => {
            return Promise.all((<any[]>rows).map(row => {
                const type = row.type;
                const user = users.find(u => u.userId === row.uid) as UserBriefInfo;
                if (type === 'album') {
                    return getAlbum(row.entity_id).then(album => (<Activity>{
                        user,
                        type,
                        payload: album
                    }));
                } else {
                    return getPost(row.entity_id).then(post => (<Activity>{
                        user,
                        type,
                        payload: post
                    }));
                }
            }));
        }));
}
