import { executeQuery } from '../utils/sqliteUtils';
import { mapKeys, getKeysAndValues } from '../utils/objectUtils';
import { convertDataToImage } from '../utils/imageUtils';

type Post = {
    ownerId: number,
    ownerName: string,
    ownerIdentityCode: number,
    ownerGenderCode: number,
    requiredRegionCode: number,
    costOptionCode: number,
    cost: number,
    content: string,
    tagCodes: number[],
    photoUrls: string[],
    launchTime: Date,
    isClosed: boolean,
    themeId: number,
    themeName: string,
    themeCoverUrl: string
};

export function getLatestPosts(pageNum: number, pageSize: number) {
    // todo
}