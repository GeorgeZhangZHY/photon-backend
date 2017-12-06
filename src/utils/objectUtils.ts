/**
 * 在不修改原有对象的情况下，将一个对象的所有键名批量转换为新的键名，返回转换完成的新对象
 * @param source 待转换的对象
 * @param keyMap 由旧的键名到新的键名的映射
 * @param isReverse 是否反向，默认不反向（即false)
 */
export function mapKeys(source: Object, keyMap: Object, isReverse: boolean = false): Object {
    let result = {};
    Object.getOwnPropertyNames(keyMap).forEach(key => {
        if (isReverse) {
            if (source.hasOwnProperty(keyMap[key])) {
                result[key] = source[keyMap[key]];
            }
        } else {
            if (source.hasOwnProperty(key)) {
                result[keyMap[key]] = source[key];
            }
        }
    });
    return result;
}

/**
 * 以二维数组的形式返回一个对象自身的所有键值对
 * @param obj 
 */
export function getEntries(obj: Object): [string, any][] {
    return <[string, any][]>Object.getOwnPropertyNames(obj).map(key => [key, obj[key]]);
}

/**
 * 由键值对构造对象
 * @param entries 对象的所有键值对所构成的二维数组
 */
export function constructObjectFromEntries(entries: [string, any][]): any {
    let result = {};
    entries.forEach(entry => {
        result[entry[0]] = entry[1];
    });
    return result;
}

/**
 * 返回一个对象的所有键和所有值，其位置一一对应
 * @param obj 
 */
export function getKeysAndValues(obj: Object) {
    let result: { keys: string[], values: any[] } = { keys: [], values: [] };
    Object.getOwnPropertyNames(obj).forEach(key => {
        result.keys.push(key);
        result.values.push(obj[key]);
    });
    return result;
}

/**
 * 将多维数组扁平化为一维数组
 * @param arr 任意嵌套的数组
 * @returns 扁平化后的一维数组
 */
export function flattenArray(arr: any[]): any[] {
    let result: any[] = [];
    (function readIn(a: any[]): void {
        a.forEach(element => {
            if (element instanceof Array) {
                readIn(element);
            } else {
                result.push(element);
            }
        });
    })(arr);
    return result;
}