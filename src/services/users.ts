import * as passport from 'passport';
import * as passportLocal from 'passport-local';
import { executeQuery, insertData, updateData, deleteData, checkExist } from '../utils/sqliteUtils';
import { mapKeys } from '../utils/objectUtils';
import { convertDataToImage } from '../utils/imageUtils';
import { globalMap } from '../config/globalMap';

export type UserBriefInfo = {
    userId: number,
    userName: string,
    identity: string,
    gender: string,
    regionCode: number,
    regionName: string,
    avatarUrl: string
};

type User = {
    password?: string,
    wechatId: string,
    qqNum: number,
    phoneNum: string, // node-sqlite3在进行sql转义后，较大的数的长度始终无法匹配数据CHECK约束，改为字符串可解决
    wechatQRCodeUrl: string
} & UserBriefInfo;

const objectToDataMap = globalMap;

export function getUserBriefInfo(userId: number): Promise<UserBriefInfo> {
    const sqlStr = `SELECT u.uid, u.identity, u.gender, u.rid, u.uname, u.avatar_url, r.rname 
                    FROM users u LEFT JOIN regions r ON u.rid = r.rid
                    WHERE uid = ?`;
    return executeQuery(sqlStr, [userId]).then(rows => {
        let user = <UserBriefInfo>mapKeys(rows[0], objectToDataMap, true);
        return user;
    });
}

// 检查用户名是否已被使用
export function checkUserName(userName: string): Promise<{ isUsed: boolean }> {
    return checkExist('users', {
        uname: userName
    }).then(result => ({
        isUsed: result
    }));
}

export function deleteUser(userId: number): Promise<void> {
    const condition = {
        uid: userId
    };
    return deleteData('users', condition);
}

export function addNewUser(newUser: Partial<User>): Promise<void> {
    const userData = mapKeys(newUser, objectToDataMap);
    return insertData('users', userData);  // 数据有效性检验通过sql约束来进行
}

// 修改除了头像和二维码之外的信息
export function modifyUserInfo(modifiedUser: User): Promise<void> {
    const modifiedUserData = mapKeys(modifiedUser, objectToDataMap);
    return updateData('users', ['uid'], modifiedUserData);
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

passport.use(new passportLocal.Strategy({ usernameField: 'userName' }, (username, password, done) => {
    const sqlStr = `SELECT u.*, r.rname 
                    FROM users u LEFT JOIN regions r ON u.rid = r.rid
                    WHERE u.uname = ?`;
    executeQuery(sqlStr, [username]).then((result) => {
        if ((<any[]>result).length === 0) {
            return done(null, false, { message: 'No such user!' });
        }
        const user = <User>mapKeys(result[0], objectToDataMap, true);
        if (user && (user.password === password)) {
            delete user.password; // 前端不应拿到用户密码
            done(null, user);
        } else {
            done(null, false, { message: 'Wrong password!' });
        }
    }).catch(err => {
        done(err);
    });
}));

passport.serializeUser((user: Partial<User>, done) => {
    done(null, user.userId);
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