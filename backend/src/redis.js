const asyncRedis = require('async-redis')
const redis = require("redis")
const client = redis.createClient(process.env.REDIS_URI)
module.exports.callback_client = client
module.exports.redisClient = asyncRedis.decorate(client)