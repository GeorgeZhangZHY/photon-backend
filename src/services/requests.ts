import { insertData } from '../utils/sqliteUtils';
import { mapKeys } from '../utils/objectUtils';

type NewRequest = {
    userId: number,
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

}

const objectToDataMap = {
    userId: 'uid',
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

// 获取用户发起约拍请求
export function getOwnRequests(userId: number): Promise<Request[]> {
    const sqlStr =
}