const express = require('express')
const LoginAttempt = require('./login_attempt')
const { anyToString } = require('../util/aux_functions')
const validate_login_attempt = require('./validate_login_attempt')
const generate_access_token_key = require('../util/generate_access_token_key')

const oauth2Router = express.Router()

oauth2Router.get('/login/authorize', async (req, res) => {
    // Client public id
    const client_id = anyToString(req.query.client_id)
    // Redirect uri after authorized or not. This should match public key enabled redirect_uri(s)
    const redirect_uri = anyToString(req.query.redirect_uri)
    // Suggests a specific account to use for signing in and authorizing the app.
    const login = anyToString(req.query.login)
    // Default minimun access: userinfo. Other scopes: email, modify, changepassword. This should match public key enabled scopes
    const scope = anyToString(req.query.scope).split(',')
    // An unguessable random string. It is used to protect against cross-site request forgery attacks.
    const state = anyToString(req.query.state)
    // users are members of groups from Active Directory. This groups are tipically security froups.
    // Allow only users thar are members of
    const require_groups = anyToString(req.query.require_groups).split(',')
    // Don't allow users that are members of
    const exclude_groups = anyToString(req.query.exclude_groups).split(',')

    // Create login attempr
    const loginAttempt = new LoginAttempt({
        client_id,
        scope,
        state,
        require_groups,
        exclude_groups,
        // key is used to redirect user to login UI and know login details are correct
        key: generate_access_token_key(),
    })

    if (await validate_login_attempt(loginAttempt)) {
        req.session.login_attempt = loginAttempt
        req.redirect("/login?key=" + loginAttempt.key)
    } else {
        res.redirect("/login-inválido")
    }
})

// Used for internal app
oauth2Router.post('/login/api/login', async (req, res) => {

    if (!req.header('host') || req.header('host') != process.env.AUTH_SERVER_HOST) {
        res.status(403).json("forbidden")
        return
    }

    const username = anyToString(req.body.username)
    const password = anyToString(req.body.password)

    if (req.body.use_logged_user && (anyToString(process.env.ALLOW_KEEP_LOGGED_USERS) == 'true' || anyToString(process.env.ALLOW_KEEP_LOGGED_USERS) == 'yes')) {
        // check session for logged users and ignore password
        // this users must be previously authorized
    }

    const [user, err] = validateUserCredentials(username, password)

    if (user && !err) {
        // generate temportal code
        // generate access_token based on login_attempt
        // redirect_uri?code=code
    }
})

oauth2Router.post('/login/access_token', (req, res) => {
    // Client public id
    const client_id = anyToString(req.query.client_id)
    // Client secret key
    const client_secret = anyToString(req.query.client_secret)
    // Temporal code
    const code = anyToString(req.query.code)
    // Redirect uri, same as before. Necessary for correct authorization
    const redirect_uri = anyToString(req.query.redirect_uri)
})

module.exports = oauth2Router