/**
 * 在不修改原有对象的情况下，将一个对象的所有键名批量转换为新的键名，返回转换完成的新对象
 * @param source 待转换的对象
 * @param keyMap 由旧的键名到新的键名的映射
 * @param isReverse 是否反向，默认不反向
 */
export function mapKeys(source: Object, keyMap: Object, isReverse: boolean = false): Object {
    let result = {};
    Object.getOwnPropertyNames(keyMap).forEach(key => {
        if (isReverse) {
            result[key] = source[keyMap[key]];
        } else {
            result[keyMap[key]] = source[key];
        }
    });
    return result;
}

/**
 * 以二维数组的形式返回一个对象自身的所有键值对
 * @param obj 
 */
// tslint:disable-next-line:no-any
export function getEntries(obj: Object): [string, any][] {
    // tslint:disable-next-line:no-any
    return <[string, any][]> Object.getOwnPropertyNames(obj).map(key => [key, obj[key]]);
}