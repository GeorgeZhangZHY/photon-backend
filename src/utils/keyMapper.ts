/**
 * 在不修改原有对象的情况下，将一个对象的所有键名批量转换为新的键名
 */
export default function mapKeys(source: Object, keyMap: Object, isReverse: boolean = false): Object {
    let result = {};
    for (let key in keyMap) {
        if (keyMap.hasOwnProperty(key)) {
            if (isReverse) {
                result[key] = source[keyMap[key]];
            } else {
                result[keyMap[key]] = source[key];
            }
        }
    }
    return result;
}