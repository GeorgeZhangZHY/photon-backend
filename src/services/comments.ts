import { insertData, executeQuery, deleteData } from '../utils/sqliteUtils';
import { mapKeys } from '../utils/objectUtils';
import { UserBriefInfo } from './users';

type NewComment = {
    userId: number,
    albumId: number,
    content: string
};

type Comment = UserBriefInfo & NewComment & {
    commentId: number,
    commentTime: string
};

const objectToDataMap = {
    userId: 'uid',
    albumId: 'aid',
    content: 'content',
    userName: 'uname',
    identityCode: 'iid',
    genderCode: 'gid',
    regionCode: 'rid',
    avatarUrl: 'avatar_url',
    commentId: 'cid',
    commentTime: 'comment_time'
};

export function addNewComment(newComment: NewComment) {
    return insertData('comments', mapKeys(newComment, objectToDataMap));
}

export function deleteComment(commentId: number) {
    return deleteData('comments', { cid: commentId });
}

export function getComments(albumId: number): Promise<Comment[]> {
    const sqlStr = `SELECT c.*, u.avatar_url, u.uname, u.gid, u.iid, u.rid
                    FROM comments c, users u
                    WHERE c.aid = ? AND c.uid=u.uid
                    ORDER BY c.cid ASC`;
    return executeQuery(sqlStr, [albumId])
        .then(rows => (<any[]>rows).map(row => <Comment>mapKeys(row, objectToDataMap, true)));
}