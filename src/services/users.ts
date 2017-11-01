import * as passport from 'passport';
import * as passportLocal from 'passport-local';
import { executeQuery, insertData, updateData } from '../utils/sqliteUtils';
import { mapKeys } from '../utils/objectUtils';
import { convertDataToImage } from '../utils/imageUtils';

type User = {
    id: number,
    password?: string,
    name: string,
    wechatId: string,
    qqNum: number,
    phoneNum: string, // node-sqlite3在进行sql转义后，较大的数的长度始终无法匹配数据CHECK约束，改为字符串可解决
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

export function addNewUser(newUser: Partial<User>): Promise<void> {
    const userData = mapKeys(newUser, objectToDataMap);
    return insertData('users', userData);  // 数据有效性检验通过sql约束来进行
}

// 修改除了头像和二维码之外的信息
export function modifyUserInfo(modifiedUser: User): Promise<void> {
    const modifiedUserData = mapKeys(modifiedUser, objectToDataMap);
    return updateData('users', 'uid', modifiedUserData);
}

export function modifyAvatar(id: number, newAvatarDataUrl: string): Promise<void> {
    const path = './public/avatars/u' + id + '.png';
    return <Promise<void>>convertDataToImage(newAvatarDataUrl, path).then(() => {
        const sqlStr = 'UPDATE users SET avatar_url = ? WHERE uid = ?';
        return executeQuery(sqlStr, [path, id]);
    });
}

export function modifyQRCode(id: number, newQRCodeDataUrl: string): Promise<void> {
    const path = './public/qrCodes/u' + id + '.png';
    return <Promise<void>>convertDataToImage(newQRCodeDataUrl, path).then(() => {
        const sqlStr = 'UPDATE users SET wechat_qrcode_url = ? WHERE uid = ?';
        return executeQuery(sqlStr, [path, id]);
    });
}

passport.use(new passportLocal.Strategy({ usernameField: 'name' }, (username, password, done) => {
    const sqlStr = 'SELECT * FROM users WHERE uname = ?';
    executeQuery(sqlStr, [username]).then((result) => {
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
    executeQuery(sqlStr, [id]).then(result => {
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