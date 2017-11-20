import { insertData, executeQuery, updateData } from '../utils/sqliteUtils';
import { mapKeys } from '../utils/objectUtils';
import { createLocalMap } from '../config/globalMap';

type NewRequest = {
    requesterId: number,
    postId: number,
    message: string,
};

type RequesterInfo = {
    requesterName: string,
    gender: string,
    identity: string,
    avatarUrl: string,
    wechatQRCodeUrl: string,
    wechatId: string,
    qqNum: number,
    phoneNum: number
};

// 他人对该用户发起的约拍请求
type OthersRequest = {
    hasRead: boolean,
    requestTime: string
} & NewRequest & RequesterInfo;

// 用户自己向他人发起的约拍请求
type OwnRequest = {
    requestTime: string
} & NewRequest;

const objectToDataMap = createLocalMap({
    requesterId: 'uid',
    requesterName: 'uname'
});

export function addNewRequest(newRequest: NewRequest): Promise<void> {
    const requestData = mapKeys(newRequest, objectToDataMap);
    return insertData('requests', requestData);
}

// 获取用户发起的约拍请求
export function getOwnRequests(userId: number): Promise<OwnRequest[]> {
    const sqlStr = 'SELECT uid, pid, message, request_time FROM requests WHERE uid = ?';
    return executeQuery(sqlStr, [userId]).then(rows =>
        (<any[]>rows).map(row => <OwnRequest>mapKeys(row, objectToDataMap, true))
    );
}

/**
 * 获得他人向该用户发起的所有约拍请求，含已读的和未读的 
 */
export function getOthersRequests(userId: number, pageNum: number, pageSize: number): Promise<OthersRequest[]> {
    const sqlStr = `SELECT r.*, u.gender, u.identity, u.uname, u.phone_num, u.qq_num, 
                        u.wechat_id, u.wechat_qrcode_url, u.avatar_url
                    FROM users u, requests r, posts p
                    WHERE p.uid = ? AND p.pid = r.pid AND r.uid = u.uid
                    ORDER BY request_time DESC LIMIT ? OFFSET ?`;
    return executeQuery(sqlStr, [userId, pageSize, pageNum * pageSize])
        .then(rows => (<any[]>rows).map(row => <OthersRequest>mapKeys(row, objectToDataMap, true)));
}

/**
 * 获得他人向该用户发起的未读的约拍请求
 */
export function getUnreadOthersRequests(userId: number): Promise<OthersRequest[]> {
    const sqlStr = `SELECT r.*, u.gender, u.identity, u.uname, u.phone_num, u.qq_num, 
                        u.wechat_id, u.wechat_qrcode_url, u.avatar_url
                    FROM users u, requests r, posts p
                    WHERE p.uid = ? AND p.pid = r.pid AND r.uid = u.uid AND r.has_read = 0
                    ORDER BY request_time DESC`;
    return executeQuery(sqlStr, [userId])
        .then(rows => (<any[]>rows).map(row => <OthersRequest>mapKeys(row, objectToDataMap, true)));
}

/**
 * 
 * @param requesterId 请求发起者的id
 * @param postId 
 */
export function setRequestRead(requesterId: number, postId: number) {
    const data = {
        has_read: 1,
        uid: requesterId,
        pid: postId
    };
    return updateData('requests', ['uid', 'pid'], data);
}

// 查询是否已向某个帖子发起约拍请求
export function checkRequest(requesterId: number, postId: number): Promise<{ hasRequested: boolean }> {
    const sqlStr = `SELECT count(*) AS hasRequested
                    FROM requests
                    WHERE uid = ? AND pid = ?`;
    return executeQuery(sqlStr, [requesterId, postId]).then(rows => ({
        hasRequested: !!(rows[0].hasRequested)
    }));
}