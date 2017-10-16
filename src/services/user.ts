import { executeQuery, escape } from '../utils/mysqlUtils';
import mapKeys from '../utils/keyMapper';

export type User = {
    id: number,
    password: string,
    name: string,
    wechatId: string,
    qqNum: number,
    phoneNum: number,
    identityCode: number,
    genderCode: number,
    regionCode: number,
    wechatQRCodeUrl: string,
    avatarUrl: string
};

const objectToDataMap = {
    id: 'uid',
    password: 'upassword',
    name: 'uname',
    wechatQRCodeUrl: 'wechat_qrcode_url',
    wechatId: 'wechat_id',
    qqNum: 'qq_num',
    avatarUrl: 'avatar_url',
    phoneNum: 'phone_num',
    identityCode: 'iid',
    genderCode: 'gid',
    regionCode: 'rid'
};

// 对用户输入的数据进行检验及处理，以便进行sql操作，若存在不合法的数据，则向浏览器反馈失败信息；
function validateUserInput(userInput: Partial<User>): boolean {
    // sql转义，避免sql注入攻击
    Object.getOwnPropertyNames(userInput).forEach(key => {
        userInput[key] = escape(userInput[key]);
    });

    // 业务逻辑检验，只反馈失败结果即可，浏览器端的检测已经标明失败原因
    if (userInput.phoneNum && (userInput.phoneNum.toString().length !== 11)) {
        return false;
    }

    return true;
}

export function addNewUser(newUser: Partial<User>): Promise<{}> | false {
    if (!validateUserInput(newUser)) {
        return false;
    }
    const sqlStr = 'INSERT INTO users SET ?';
    const values = mapKeys(newUser, objectToDataMap);
    return executeQuery(sqlStr, values);
}