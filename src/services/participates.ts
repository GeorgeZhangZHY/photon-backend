import { UserBriefInfo } from './users';
import { insertData, executeQuery, deleteData } from '../utils/sqliteUtils';
import { mapKeys } from '../utils/objectUtils';

type NewParticipate = {
    albumId: number,
    userId: number
};

type ParticipateNotification = NewParticipate & UserBriefInfo & {
    albumName: string,
    status: string,
    createTime: string
};

const objectToDataMap = {
    albumName: 'aname',
    albumId: 'aid',
    userId: 'uid',
    avatarUrl: 'avatar_url',
    identityCode: 'iid',
    genderCode: 'gid',
    regionCode: 'rid',
    userName: 'uname',
    status: 'status',
    createTime: 'create_time'
};

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
                    WHERE p.aid = ? AND p.status = 'confirmed'
                    ORDER BY p.create_time ASC`;
    return executeQuery(sqlStr, [albumId])
        .then(rows => (<any[]>rows).map(row => <UserBriefInfo>mapKeys(row, objectToDataMap, true)));
}

/**
 * 获得一个用户接收到的请求添加参与者的请求
 */
export function getParticipateRequests(userId: number): Promise<ParticipateNotification> {
    const sqlStr = ``
}