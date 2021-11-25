const asyncRedis = require('async-redis')
const redis = require("redis")
const client = redis.createClient(process.env.REDIS_URL ? { url: process.env.REDIS_URL } : undefined)
module.exports.callback_client = client
module.exports.redisClient = asyncRedis.decorate(client)