/**
 * 在不修改原有对象的情况下，将一个对象的所有键名批量转换为新的键名
 */
export default function mapKeys(oldObject: Object, oldKeyToNewKeyMap: Object): Object {
    let result = {};
    Object.getOwnPropertyNames(oldKeyToNewKeyMap).forEach(oldKey => {
        result[oldKeyToNewKeyMap[oldKey]] = oldObject[oldKey];
    });
    return result;
}