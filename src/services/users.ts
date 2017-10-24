import * as passport from 'passport';
import * as passportLocal from 'passport-local';
import { executeQuery } from '../utils/sqliteUtils';
import { mapKeys, getKeysAndValues } from '../utils/objectUtils';
import { convertDataToImage } from '../utils/imageUtils';

type User = {
    id: number,
    password?: string,
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
    // 业务逻辑检验，只反馈失败结果即可，浏览器端的检测已经标明失败原因
    if (userInput.phoneNum && (userInput.phoneNum.toString().length !== 11)) {
        return false;
    }

    return true;
}

export function addNewUser(newUser: Partial<User>): Promise<void> | false {
    if (!validateUserInput(newUser)) {
        return false;
    }
    const userData = mapKeys(newUser, objectToDataMap);
    const { keys, values } = getKeysAndValues(userData);
    const sqlStr = `INSERT INTO users (${keys.join(',')})
                    VALUES(${keys.map(() => '?').join(',')})`;

    return <Promise<void>>executeQuery(sqlStr, values);
}

// 修改除了头像和二维码之外的信息
export function modifyUserInfo(modifiedUser: User): Promise<void> {
    const modifiedUserData = mapKeys(modifiedUser, objectToDataMap);
    const { keys, values } = getKeysAndValues(modifiedUserData);
    values.push(modifiedUser.id);
    const sqlStr = `UPDATE users SET ${keys.map(key => key + ' = ?').join(', ')} WHERE uid = ?`;  // 该库只有‘=’后可以用占位符
    return <Promise<void>>executeQuery(sqlStr, values);
}

export function modifyAvatar(id: number, newAvatarDataUrl: string): Promise<void> {
    const path = './public/avatars/u' + id + '.png';
    return <Promise<void>>convertDataToImage(newAvatarDataUrl, path).then(() => {
        const sqlStr = 'UPDATE users SET avatar_url = ? WHERE uid = ?';
        return executeQuery(sqlStr, [path, id]);
    });
}

export function modifyQRCode(id: number, newQRCodeDataUrl: string): Promise<void>{
    const path = './public/qrCodes/u' + id + '.png';
    return <Promise<void>>convertDataToImage(newQRCodeDataUrl, path).then(() => {
        const sqlStr = 'UPDATE users SET wechat_qrcode_url = ? WHERE uid = ?';
        return executeQuery(sqlStr, [path, id]);
    }); 
}

passport.use(new passportLocal.Strategy({ usernameField: 'name' }, (username, password, done) => {
    const sqlStr = 'SELECT * FROM users WHERE uname = ?';
    executeQuery(sqlStr, username).then((result) => {
        if ((<any[]>result).length === 0) {
            return done(null, false, { message: 'No such user!' });
        }
        const user = <User>mapKeys(result[0], objectToDataMap, true);
        if (user && (user.password === password)) {
            user.password = undefined; // 前端不应拿到用户密码
            done(null, user);
        } else {
            done(null, false, { message: 'Wrong password or username!' });
        }
    }).catch(err => {
        done(err);
    });
}));

passport.serializeUser((user: Partial<User>, done) => {
    done(null, user.id);
});

passport.deserializeUser((id: number, done) => {
    const sqlStr = 'SELECT * FROM users WHERE uid = ?';
    executeQuery(sqlStr, id).then(result => {
        if ((<any[]>result).length === 0) {
            return done('No such user!');
        }
        const user = <User>mapKeys(result[0], objectToDataMap, true);
        done(null, user);
    }).catch(err => {
        done(err);
    });
});

export const configuredPassport = passport; 