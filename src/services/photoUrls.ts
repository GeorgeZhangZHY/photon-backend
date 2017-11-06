import { deleteImage } from '../utils/imageUtils';
import { insertData, deleteData, executeQuery } from '../utils/sqliteUtils';

/**
 * 比较客户端传来的url和服务器已有的url，从而确定应该删除哪些图片，新增哪些图片
 */
function diffPhotoUrls(oldUrls: string[], newUrls: string[]) {
    let dataUrlsToAdd = newUrls.filter(newUrl => newUrl.search(/^data:image\/\w+;base64,/) !== -1);   // 为dataUrl
    let urlsToDelete = oldUrls.filter(oldUrl => newUrls.findIndex(newUrl => newUrl === oldUrl) === -1);
    return { dataUrlsToAdd, urlsToDelete };
}

/**
 * 获取一系列图片url的最大的后缀序号, 没有图片时返回-1
 */
function getMaxPhotoOrdinal(photoUrls: string[]): number {
    return photoUrls
        .map(url => +(<string[]>url.match(/\d+.png$/))[0].split('.')[0])
        .reduce((accu, next) => accu > next ? accu : next, -1);
}

/**
 * 批量替换某个表中的图片url，若原来没有数据，则直接插入
 * @param keyName 该多值属性属于原有表的属性名，如'pid','aid'等
 * @param keyValue 属性值
 * @param newPhotoUrls 新的图片url，其中新上传的部分为dataUrl格式，原有部分为url格式
 */
export function updatePhotoUrls(tableName: string,
                                newPhotoUrls: string[],
                                keyName: string,
                                keyValue: number,
                                photoSaver: (keyValue: number, dataUrl: string, index: number) => Promise<string>) {
    return executeQuery(`SELECT photo_url as photoUrl FROM ${tableName} WHERE ${keyName} = ?`, [keyValue])
        .then(rows => {
            let oldUrls: string[] = (<any[]>rows).map(row => row.photoUrl);
            const maxOldOrdinal = getMaxPhotoOrdinal(oldUrls);
            const { dataUrlsToAdd, urlsToDelete } = diffPhotoUrls(oldUrls, newPhotoUrls);
            const deleteUnwanted = Promise.all(urlsToDelete.map(url => deleteImage(url).then(() =>
                deleteData(tableName, { [keyName]: keyValue, photo_url: url })
            )));
            const addNew = Promise.all(dataUrlsToAdd.map(
                (dataUrl, index) => photoSaver(keyValue, dataUrl, maxOldOrdinal + index + 1).then(newUrl =>
                    insertData(tableName, {
                        [keyName]: keyValue,
                        photo_url: newUrl
                    })
                )
            ));
            return Promise.all([deleteUnwanted, addNew]);
        });
}

/**
 * 获得某个表中某个id下所对应的所有图片Url
 * @param tableName 表名
 * @param keyName id名，如'pid','aid'
 * @param keyValue id值
 */
export function getPhotoUrls(tableName: string, keyName: string, keyValue: number): Promise<string[]> {
    return executeQuery(`SELECT photo_url FROM ${tableName} WHERE ${keyName} = ?`, [keyValue])
        .then(rows => (<any[]>rows).map(row => <string>row.photo_url));
}