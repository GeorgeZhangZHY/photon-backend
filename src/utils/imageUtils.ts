import * as fs from 'fs';
import * as util from 'util';

const writeFile = util.promisify(fs.writeFile);
const unlink = util.promisify(fs.unlink);

export function convertDataToImage(dataUrl: string, path: string): Promise<void> {
    // 过滤data:URL, 并将被POST转换为空格的'+'恢复
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '').replace(/\s/g, '+');
    const dataBuffer = new Buffer(base64Data, 'base64');
    return writeFile(path, dataBuffer).catch(err => {
        console.log(err);
        throw err;
    });
}

export function deleteImage(path: string): Promise<void> {
    return unlink(path).catch(err => {
        console.log(err);
        throw err;
    });
}

/**
 * 比较客户端传来的url和服务器已有的url，从而确定应该删除哪些图片，新增哪些图片
 */
export function diffImageUrls(oldUrls: string[], newUrls: string[]) {
    let dataUrlsToAdd = newUrls.filter(newUrl => newUrl.search(/^data:image\/\w+;base64,/) !== -1);   // 为dataUrl
    let urlsToDelete = oldUrls.filter(oldUrl => newUrls.findIndex(newUrl => newUrl === oldUrl) === -1);
    return { dataUrlsToAdd, urlsToDelete };
}

/**
 * 获取一系列图片url的最大的后缀序号, 没有图片时返回-1
 */
export function getMaxImageOrdinal(photoUrls: string[]): number {
    return photoUrls
        .map(url => +(<string[]>url.match(/\d+.png$/))[0].split('.')[0])
        .reduce((accu, next) => accu > next ? accu : next, -1);
}