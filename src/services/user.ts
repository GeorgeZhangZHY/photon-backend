import * as passport from 'passport';
import * as passportLocal from 'passport-local';
import { executeQuery } from '../utils/sqliteUtils';
import { mapKeys, getEntries } from '../utils/objectUtils';

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
    const userData = mapKeys(newUser, objectToDataMap);
    const keys = getEntries(userData).map(pair => pair[0]);
    const values = getEntries(userData).map(pair => pair[1]);
    const sqlStr = `INSERT INTO users (${keys.join(',')})
                    VALUES(${keys.map(() => '?').join(',')})`;

    return executeQuery(sqlStr, values);
}

passport.use(new passportLocal.Strategy({ usernameField: 'name' }, (username, password, done) => {
    const sqlStr = 'SELECT * FROM users WHERE uname = ?';
    executeQuery(sqlStr, username).then((result) => {
        if (result.length === 0) {
            return done('No such user!');
        }
        const user = <User>mapKeys(result[0], objectToDataMap, true);
        if (user && (user.password === password)) {
            done(null, user);
        } else {
            done(`Wrong password or username! expected: ${user.password} actual:${password}`);
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
        if (result.length === 0) {
            return done('No such user!');
        }
        const user = <User>mapKeys(result[0], objectToDataMap, true);
        done(null, user);
    }).catch(err => {
        done(err);
    });
});

export const configuredPassport = passport; 