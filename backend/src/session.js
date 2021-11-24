const session = require('express-session')
const redis = require('redis')

/*

We are using express-session with redis to store session data

*/

function createAndSetSession(app) {
    let RedisStore = require('connect-redis')(session)
    let redisClient = redis.createClient()

    app.use(
        session({
            store: new RedisStore({ client: redisClient }),
            saveUninitialized: false,
            secret: 'keyboard cat',
            resave: false,
        })
    )
}

module.exports = createAndSetSession