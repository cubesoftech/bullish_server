import Redis, { RedisOptions } from 'ioredis';

export const redisOptions: RedisOptions = {
    host: '127.0.0.1',
    port: 6379,
}

const redis = new Redis(redisOptions)
export const redisSubClient = redis.duplicate();

export default redis;