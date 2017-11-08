import { UserBriefInfo } from './users';
import { insertData, executeQuery, updateData } from '../utils/sqliteUtils';
import { mapKeys } from '../utils/objectUtils';
import { globalMap } from '../config/globalMap';

type NewParticipate = {
    albumId: number,
    userId: number
};

type ParticipateNotification = NewParticipate & UserBriefInfo & {
    albumName: string,
    status: string,
    createTime: string
};

const objectToDataMap = globalMap;

/**
 * 其他用户在相册下请求主人将自己添加为参与者
 */
export function addNewParticipateRequest(newParticipate: NewParticipate) {
    const newParticipateData = mapKeys(newParticipate, objectToDataMap);
    return insertData('participates', newParticipateData);
}

export function getParticipants(albumId: number): Promise<UserBriefInfo[]> {
    const sqlStr = `SELECT u.uname, u.avatar_url, u.uid, u.iid, u.gid, u.rid
                    FROM participates p JOIN users u ON p.uid = u.uid
                    WHERE p.aid = ? AND (p.status = 'agreed' OR p.status = 'succeeded')
                    ORDER BY p.create_time ASC`;
    return executeQuery(sqlStr, [albumId])
        .then(rows => (<any[]>rows).map(row => <UserBriefInfo>mapKeys(row, objectToDataMap, true)));
}

/**
 * 获得一个用户接收到的请求添加参与者的请求
 * @param userId 主人的id
 */
export function getParticipateRequests(userId: number): Promise<ParticipateNotification[]> {
    const sqlStr = `SELECT p.*, a.aname, u.uname, u.avatar_url, u.iid, u.rid, u.gid 
                    FROM participates p
                    JOIN albums a ON p.aid = a.aid
                    JOIN users u ON p.uid = u.uid
                    WHERE a.uid = ? AND p.status = 'pending'`; // 其中的用户信息是申请者的
    return executeQuery(sqlStr, [userId])
        .then(rows => (<any[]>rows).map(row => <ParticipateNotification>mapKeys(row, objectToDataMap, true)));
}

/**
 * 主人同意或拒绝将某人添加为某相册的参与者
 * @param userId 申请者的id
 */
export function resolveParticipate(albumId: number, userId: number, agreed: boolean) {
    const data = {
        aid: albumId,
        uid: userId,
        status: agreed ? 'agreed' : 'rejected'
    };
    return updateData('participates', ['aid', 'uid'], data);
}

/**
 * 用户获得主人处理申请的结果
 * @param requesterId 申请者的id
 */
export function getParticipateResults(requesterId: number): Promise<ParticipateNotification[]> {
    const sqlStr = `SELECT p.status, p.create_time, p.aid, a.aname, u.uid, u.uname, u.avatar_url, u.iid, u.rid, u.gid
                    FROM participates p
                    JOIN albums a ON p.aid = a.aid
                    JOIN users u ON a.uid = u.uid
                    WHERE p.uid = ? AND (p.status = 'rejected' OR p.status = 'agreed')`; // 其中的用户信息是主人的
    return executeQuery(sqlStr, [requesterId])
        .then(rows => (<any[]>rows).map(row => <ParticipateNotification>mapKeys(row, objectToDataMap, true)));
}

export function setParticipateResultRead(albumId: number, userId: number, prevStatus: 'agreed' | 'rejected') {
    const nextStatus = {
        agreed: 'succeeded',
        rejected: 'failed'
    };
    const data = {
        aid: albumId,
        uid: userId,
        status: nextStatus[prevStatus]
    };
    return updateData('participates', ['aid', 'uid'], data);
}