import { insertData, deleteData } from '../utils/sqliteUtils';
import { mapKeys } from '../utils/objectUtils';

type NewFollow = {
    userId: number,
    followerId: number
};

const objectToDataMap = {
    userId: 'uid',
    followerId: 'follower_id'
};

export function addNewFollow(newFollow: NewFollow) {
    const newFollowData = mapKeys(newFollow, objectToDataMap);
    return insertData('follows', newFollowData);
}

export function cancelFollow(userId: number, followerId: number) {
    return deleteData('follows', { uid: userId, follower_id: followerId });
}