import { insertData, deleteData, executeQuery, updateData } from '../utils/sqliteUtils';
import { mapKeys } from '../utils/objectUtils';
import { UserBriefInfo } from './users';
import { globalMap } from '../config/globalMap';

type NewFollow = {
    userId: number,
    followerId: number
};

type FollowNotification = UserBriefInfo & {
    createTime: string,
    followerId: number
};  // 实际没有userId，只有followerId

const objectToDataMap = globalMap;

export function addNewFollow(newFollow: NewFollow) {
    const newFollowData = mapKeys(newFollow, objectToDataMap);
    return insertData('follows', newFollowData);
}

export function cancelFollow(userId: number, followerId: number) {
    return deleteData('follows', { uid: userId, follower_id: followerId });
}

// 获得关注某个用户的所有用户（某用户的粉丝）
export function getFollowers(userId: number, pageNum: number, pageSize: number): Promise<UserBriefInfo[]> {
    const sqlStr = `SELECT f.follower_id, u.uname, u.identity, u.rid, u.gender, u.avatar_url, r.rname
                    FROM follows f 
                        JOIN users u ON f.follower_id = u.uid
                        LEFT JOIN regions r ON u.rid = r.rid
                    WHERE f.uid = ?
                    ORDER BY create_time DESC LIMIT ? OFFSET ?`;
    return executeQuery(sqlStr, [userId, pageSize, pageNum * pageSize])
        .then(rows => (<any[]>rows).map(row => <UserBriefInfo>mapKeys(row, objectToDataMap, true)));
}

// 获得某用户关注的所有用户
export function getFollowedUsers(followerId: number, pageNum: number, pageSize: number): Promise<UserBriefInfo[]> {
    const sqlStr = `SELECT u.uid, u.uname, u.avatar_url, u.identity, u.gender, u.rid, r.rname
                    FROM follows f 
                        JOIN users u ON f.uid = u.uid
                        LEFT JOIN regions r ON u.rid = r.rid
                    WHERE f.follower_id = ?
                    ORDER BY create_time DESC
                    LIMIT ? OFFSET ?`;
    return executeQuery(sqlStr, [followerId, pageSize, pageNum * pageSize])
        .then(rows => (<any[]>rows).map(row => <UserBriefInfo>mapKeys(row, objectToDataMap, true)));
}

// 获得某用户未读的关注者通知
export function getUnreadFollows(userId: number): Promise<FollowNotification[]> {
    const sqlStr = `SELECT f.*, u.uname, u.identity, u.rid, u.gender, u.avatar_url, r.rname
                    FROM follows f 
                        JOIN users u ON f.follower_id = u.uid
                        LEFT JOIN regions r ON u.rid = r.rid
                    WHERE f.uid = ? AND has_read = 0
                    ORDER BY create_time DESC`;
    return executeQuery(sqlStr, [userId])
        .then(rows => (<any[]>rows).map(row => <FollowNotification>mapKeys(row, objectToDataMap, true)));
}

// 将关注者通知设为已读
export function setFollowRead(userId: number, followerId: number) {
    const data = {
        uid: userId,
        follower_id: followerId,
        has_read: 1
    };
    return updateData('follows', ['uid', 'follower_id'], data);
}