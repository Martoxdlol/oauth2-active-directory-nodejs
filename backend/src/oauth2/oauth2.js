const express = require('express')
const LoginAttempt = require('./login_attempt')
const { anyToString } = require('../util/aux_functions')
const { make_secure_secret, make_id, make_short_id } = require('../util/generate_keys')
const { validateUserCredentials } = require('../ldap/validateUserCredentials')
const { redisClient } = require('../redis')
const AccessToken = require('../models/access_token')
const Oauth2Client = require('../models/oauth2_clients')

const oauth2Router = express.Router()

oauth2Router.get('/login/authorize', async (req, res) => {
    // Client public id
    const client_id = anyToString(req.query.client_id)
    // Redirect uri after authorized or not. This should match public key enabled redirect_uri(s)
    const redirect_uri = anyToString(req.query.redirect_uri)
    // Suggests a specific account to use for signing in and authorizing the app.
    const login = anyToString(req.query.login)
    // Default minimun access: userinfo. Other scopes: email, modify, changepassword. This should match public key enabled scopes
    const scope = anyToString(req.query.scope).split(',').filter(item => item.trim())
    // An unguessable random string. It is used to protect against cross-site request forgery attacks.
    const state = anyToString(req.query.state)
    // users are members of groups from Active Directory. This groups are tipically security froups.
    // Allow only users thar are members of
    const require_groups = anyToString(req.query.require_groups).split(',').filter(item => item.trim())
    // Don't allow users that are members of
    const exclude_groups = anyToString(req.query.exclude_groups).split(',').filter(item => item.trim())

    // Create login attempr
    const loginAttempt = new LoginAttempt({
        client_id,
        scope,
        login,
        state,
        require_groups,
        exclude_groups,
        redirect_uri,
        // key is used to redirect user to login UI and know login details are correct
        key: make_secure_secret(),
    })

    if (await loginAttempt.validate()) {
        req.session.login_attempt = loginAttempt
        res.redirect("/login?key=" + loginAttempt.key)
    } else {
        res.redirect("/invalid-login")
    }
})

// Used for internal app
oauth2Router.post('/login/api/login', async (req, res) => {
    // Validate headers
    if (!req.header('host') || req.header('host') != process.env.AUTH_SERVER_HOST) {
        res.status(403).json("forbidden")
        return
    }
    try {
        const url = new URL(req.header('referer'))
        if (url.host != process.env.AUTH_SERVER_HOST) throw 403
    } catch (error) {
        res.status(403).json("forbidden ")
        return
    }
    // Validate login attempt
    if (!req.session || !req.session.login_attempt || !req.session.login_attempt.key || req.session.login_attempt.key != anyToString(req.query.key)) {
        res.status(403).json("forbidden")
        return
    }

    // User credentials
    const username = anyToString(req.body.username)
    const password = anyToString(req.body.password)

    if (req.body.use_logged_user && (anyToString(process.env.ALLOW_KEEP_LOGGED_USERS) == 'true' || anyToString(process.env.ALLOW_KEEP_LOGGED_USERS) == 'yes')) {
        // check session for logged users and ignore password
        // this users must be previously authorized
    }

    const [user, err] = await validateUserCredentials(username, password)

    try {
        if (user && !err) {
            let key = ''
            let code = ''
            // generate access_token based on login_attempt

            // get client (verify still exists)
            const client = await Oauth2Client.findOne({ client_id: req.session.login_attempt.client_id })
            if (!client) {
                throw 403
            }

            const accessToken = new AccessToken({
                client: client._id,
                redirect_uri: req.session.login_attempt.redirect_uri,
                username: user[process.env.USERNAME_ATTRIBUTE],
            })

            await accessToken.save()

            // generate temportal code
            while (!key || await redisClient.EXISTS(key)) {
                code = make_short_id()
                key = process.env.REDIS_PREFIX + 'temporal_code:' + code
            }
            await redisClient.SET(key, accessToken._id.toString())
            await redisClient.EXPIRE(key, process.env.ACCESS_TOKEN_DURATION)

            // Save redirect_uri
            const r_uri = req.session.login_attempt.redirect_uri

            // Delete login attempt
            req.session.login_attempt = null

            // location.href = redirect_uri?code=code
            const u = new URL(r_uri)
            u.searchParams.set("code", code)
            res.json(u.toString())
        } else {
            console.log(err)
            res.status(401).json("unauthorized")
        }
    } catch (error) {
        console.error(error)
        res.status(500).json("internal_error")
    }
})

oauth2Router.post('/login/access_token', async (req, res) => {
    // Client public id
    const client_id = anyToString(req.query.client_id)
    // Client secret key
    const client_secret = anyToString(req.query.client_secret)
    // Temporal code
    const code = anyToString(req.query.code)
    // Redirect uri, same as before. Necessary for correct authorization
    const redirect_uri = anyToString(req.query.redirect_uri)

    try {
        const access_token_id = await redisClient.GET(process.env.REDIS_PREFIX + 'temporal_code:' + code)
        if (!access_token_id) {
            throw 1
        }
        const accessToken = await AccessToken.findById(access_token_id)
        if (!accessToken) {
            throw 2
        }
        if (accessToken.redirect_uri != redirect_uri) {
            // throw 3
        }
        const client = await Oauth2Client.findById(accessToken.client)
        if (!client) {
            throw 4
        }
        if (client.client_secret != client_secret || client.client_id != client_id) {
            throw 5
        }
        await redisClient.DEL(process.env.REDIS_PREFIX + 'temporal_code:' + code)
        res.json({ access_token: accessToken.access_token })
    } catch (error) {
        console.log(error)
        res.status(403).json('forbidden')
    }
})

module.exports = oauth2Router