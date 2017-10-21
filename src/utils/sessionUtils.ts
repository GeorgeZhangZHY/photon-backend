import * as redis from 'redis';
import * as expressSession from 'express-session';
import * as connectRedis from 'connect-redis';

const RedisStore = connectRedis(expressSession);
const redisClient = redis.createClient();

export const expressSessionHandler = expressSession({
    secret: 'GeorgeZhangEgool',
    cookie: { maxAge: 60 * 60 * 1000 },     // 一个小时
    store: new RedisStore({
        client: redisClient,
        ttl: 60 * 60    // 一个小时
    }),
    resave: false,
    saveUninitialized: false
});
