import { getEntries, constructObjectFromEntries } from '../utils/objectUtils';

// 对象属性名和数据库列名的一一映射
export const globalMap = {

    password: 'upassword',

    themeId: 'tid',
    albumId: 'aid',
    userId: 'uid',
    regionCode: 'rid',
    followerId: 'follower_id',
    commentId: 'comid',
    postId: 'pid',
    wechatId: 'wechat_id',
    creatorId: 'creator_id',

    themeDescription: 'tdesc',

    albumName: 'aname',
    themeName: 'tname',
    userName: 'uname',
    regionName: 'rname',

    costOption: 'coption',
    tag: 'tag',
    identity: 'identity',
    gender: 'gender',

    avatarUrl: 'avatar_url',
    themeCoverUrl: 'cover_url',
    wechatQRCodeUrl: 'wechat_qrcode_url',

    shotLocation: 'shot_location',
    shotDevice: 'shot_device',
    description: 'description',
    photoUrls: 'photo_urls',

    coverOrdinal: 'cover_ordinal',

    shotTime: 'shot_time',
    createTime: 'create_time',
    commentTime: 'comment_time',
    launchTime: 'launch_time',
    requestTime: 'request_time',

    status: 'status',
    message: 'message',
    content: 'content',
    cost: 'cost',

    isClosed: 'is_closed',
    hasRead: 'has_read',

    requestNum: 'rnum',
    qqNum: 'qq_num',
    phoneNum: 'phone_num',
    collectNum: 'collect_num',
    postNum: 'post_num'
};

/**
 * 使用本地的映射规则来替换全局规则中的重名部分, 返回新构造的规则
 * @param localMap 本地规则与全局规则中不一样的部分
 */
export function createLocalMap(localMap: { [key: string]: string }): { [key: string]: string } {
    let finalEntries = getEntries(globalMap);
    let localEntries = getEntries(localMap);
    localEntries.forEach(localEntry => {
        let collisionIndex = finalEntries.findIndex((entry) =>
            entry[0] === localEntry[0] || entry[1] === localEntry[1]);
        if (collisionIndex !== -1) {
            finalEntries[collisionIndex] = localEntry;
        }
    });
    return constructObjectFromEntries(finalEntries);
}