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