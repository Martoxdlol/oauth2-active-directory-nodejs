const session = require('express-session')
const { callback_client } = require('./redis')

/*

We are using express-session with redis to store session data

*/

function createAndSetSession(app) {
    let RedisStore = require('connect-redis')(session)

    app.use(
        session({
            store: new RedisStore({ client: callback_client }),
            saveUninitialized: false,
            secret: 'keyboard cat',
            resave: false,
        })
    )
}

module.exports = createAndSetSession