import { insertData, executeQuery } from '../utils/sqliteUtils';
import { mapKeys } from '../utils/objectUtils';

type NewRequest = {
    requesterId: number,
    postId: number,
    message: string,
};

type RequesterInfo = {
    name: string,
    genderCode: number,
    identityCode: number,
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

const objectToDataMap = {
    requesterId: 'uid',
    postId: 'pid',
    message: 'message',
    requestTime: 'request_time',
    hasRead: 'has_read',
    name: 'uname',
    genderCode: 'gid',
    identityCode: 'iid',
    avatarUrl: 'avatar_url',
    wechatQRCodeUrl: 'wechat_qrcode_url',
    wechatId: 'wechat_id',
    qqNum: 'qq_num',
    phoneNum: 'phone_num',
};

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
    const sqlStr = `SELECT r.*, u.gid, u.iid, u.uname, u.phone_num, u.qq_num, 
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
    const sqlStr = `SELECT r.*, u.gid, u.iid, u.uname, u.phone_num, u.qq_num, 
                        u.wechat_id, u.wechat_qrcode_url, u.avatar_url
                    FROM users u, requests r, posts p
                    WHERE p.uid = ? AND p.pid = r.pid AND r.uid = u.uid AND r.has_read = 0
                    ORDER BY request_time DESC`;
    return executeQuery(sqlStr, [userId])
        .then(rows => (<any[]>rows).map(row => <OthersRequest>mapKeys(row, objectToDataMap, true)));
}

export function setRequestRead(userId: number, postId: number) {
    const sqlStr = `UPDATE requests
                    SET has_read = 1
                    WHERE uid = ? AND pid = ?`;
    return <Promise<void>>executeQuery(sqlStr, [userId, postId]);
}