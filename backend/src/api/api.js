const express = require('express')
const { redisClient } = require('../redis')
const sendMail = require('../email/sendmail')
const AD = require('ad')
const { make_secure_secret, make_id, make_short_id } = require('../util/generate_keys')
const { anyToString } = require('../util/aux_functions')

const validator = require("email-validator")
const modifyPassword = require('../ldap/modifyPassword')
const findUser = require('../ldap/findUser')
const AccessToken = require('../models/access_token')
const findUsers = require('../ldap/findUsers')

const apiRouter = express.Router()

const username_regex = /^\w[\w\.\- ]+$/
const ad = new AD({
    url: process.env.LDAP_SERVER_HOST,
    user: process.env.LDAP_BIND_USERNAME,
    pass: process.env.LDAP_BIND_PW
})

apiRouter.post('/account/request-reset-password', async (req, res) => {
    let username = anyToString(req.body.username)
    const email = anyToString(req.body.email)
    try {

        // Verify form
        if (!username_regex.test(username) || !validator.validate(email)) {
            res.status(400).json('bad_request')
            return
        }

        // Find user and user email address
        const user = await ad.user(username).get()
        if (!user || !validator.validate(user.mail) || user.mail != email) {
            res.status(403).json('user email doesn\'t match')
            return
        }
        username = user.sAMAccountName

        // Check if eligible for password change
        // I'll do it later

        // Create temporal code
        let code
        let key
        while (!key || await redisClient.EXISTS(key)) {
            code = make_secure_secret()
            key = process.env.REDIS_PREFIX + 'password_reset_code:' + code
        }
        await redisClient.SET(key, username)
        await redisClient.EXPIRE(key, process.env.RESET_PASSWORD_LINK_DURATION)

        // Send email
        await sendMail({
            to: user.mail,
            subject: 'Cambiar contraseña',
            text: 'Se pidió un cambio de contraseña. Para realizarlo siga este link: https://' + process.env.AUTH_SERVER_HOST + '/reset-password?code=' + code,
            html: 'Se pidió un cambio de contraseña. Para realizarlo siga este link: <a href="https://' + process.env.AUTH_SERVER_HOST + '/reset-password?code=' + code + '">CAMBIAR CONTRASEÑA</a>',
        })

        res.json("ok")
    } catch (error) {
        console.error(error)
        res.status(400).json('bad_request')
    }

})

apiRouter.post('/account/reset-password', async (req, res) => {
    let username = anyToString(req.body.username).trim()
    const password = anyToString(req.body.password)
    const code = anyToString(req.query.code)
    try {
        // Verify form
        if (!username_regex.test(username)) {
            res.status(400).json('bad_request')
            return
        }

        // Find user correct username
        const user = await findUser(username, process.env.LDAP_SERVER_HOST, process.env.LDAP_SEARCH_BASE_DN, process.env.LDAP_BIND_DN, process.env.LDAP_BIND_PW)
        if (!user) {
            res.status(403).json('user not found')
            return
        }

        username = user.sAMAccountName

        let r_username = await redisClient.GET('password_reset_code:' + code)

        // Bypass code, use fixed code. VERY INSECURE. DON'T USE IT ¡¡¡¡
        let codeByPassed = false
        if (!r_username && process.env.CHANHE_PASSWORD_BYPASS_CODE && code === process.env.CHANHE_PASSWORD_BYPASS_CODE) {
            console.log("Bypass password change to user: ", username)
            r_username = username
            codeByPassed = true
            console.log(new RegExp(process.env.CHANHE_PASSWORD_BYPASS_USER_REGEX))
            if (process.env.CHANHE_PASSWORD_BYPASS_USER_REGEX && !((new RegExp(process.env.CHANHE_PASSWORD_BYPASS_USER_REGEX)).test(username))) {
                console.log("Bypass password change to user: ", username, "CANCELLED")
                r_username = null
                codeByPassed = false
            }
        }

        // Verify username
        if (!r_username) {
            res.status(403).json('link_expired')
            return
        }

        if (r_username !== username) {
            res.status(403).json('incorrect username')
            return
        }

        // Verify password security
        if (password.length < 8 || !(/[0-9]+/gi).test(password) || !(/[\w]+/gi).test(password)) {
            res.status(400).json("insecure_password")
            return
        }

        console.log("[SERVER 1] Changing password to", username, user.dn)


        const r1 = await modifyPassword(user.dn, password, process.env.LDAP_SERVER_HOST, process.env.LDAP_BIND_DN, process.env.LDAP_BIND_PW)
        console.log("[SERVER 1]", r1)

        if (process.env.NOTIFY_CHANGES_TO) {
            let extra = ''
            if (codeByPassed) {
                extra = ' Utilizando código administrativo (bypass). '
            }
            await sendMail({
                to: process.env.NOTIFY_CHANGES_TO,
                subject: 'SE CAMBIO LA CONTRASEÑA DE ' + username,
                text: 'EL USUARIO ' + username + ' CAMBIO LA CONTRASEÑA EL ' + (new Date()).toString() + '.' + extra + ' \n\n' + JSON.stringify(user) + '\n\n',
                html: '<p>EL USUARIO ' + username + ' CAMBIO LA CONTRASEÑA EL ' + (new Date()).toString() + '.</p>' + '<p>' + extra + '</p>',
            })
        }

        // Delete code
        if (!codeByPassed) await redisClient.DEL('password_reset_code:' + code)

        // Send ok
        res.json('ok')
    } catch (error) {
        res.status(500).json("internal_error")
        console.error(error)
    }
})

apiRouter.get('/account/info', async (req, res) => {
    const access_token = req.query.access_token + ""
    if (!access_token) {
        res.status(400).json("bad_request")
        return
    }
    try {
        const accessTokenObj = await AccessToken.findOne({ access_token })
        if (accessTokenObj) {
            const user = await findUser(accessTokenObj.username, process.env.LDAP_SERVER_HOST, process.env.LDAP_SEARCH_BASE_DN, process.env.LDAP_BIND_DN, process.env.LDAP_BIND_PW)
            user.username = user.sAMAccountName
            res.json(user)
        } else {
            res.status(403).json("forbidden")
        }
    } catch (error) {
        res.status(500).json("internal_error")
    }
})

apiRouter.get('/account/all_users', async (req, res) => {
    const access_token = req.query.access_token + ""
    if (!access_token) {
        res.status(400).json("bad_request")
        return
    }
    try {
        const accessTokenObj = await AccessToken.findOne({ access_token })
        if (accessTokenObj) {
            const users = await findUsers(process.env.LDAP_SERVER_HOST, process.env.LDAP_SEARCH_BASE_DN, process.env.LDAP_BIND_DN, process.env.LDAP_BIND_PW)
            const safe_users = []
            for (const u of users) {
                safe_users.push({
                    displayName: u.displayName,
                    username: u.sAMAccountName,
                    name: u.name
                })
            }
            res.json(safe_users)
        } else {
            res.status(403).json("forbidden")
        }
    } catch (error) {
        res.status(500).json("internal_error")
    }
})

function delay(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(() => { resolve() }, ms)
    })
}

module.exports = apiRouter