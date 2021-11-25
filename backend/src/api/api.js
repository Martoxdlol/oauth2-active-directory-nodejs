const express = require('express')
const { redisClient } = require('../redis')
const sendMail = require('../email/sendmail')
const AD = require('ad')
const { make_secure_secret, make_id, make_short_id } = require('../util/generate_keys')
const { anyToString } = require('../util/aux_functions')

const validator = require("email-validator")
const modifyPassword = require('../ldap/modifyPassword')
const findUser = require('../ldap/findUser')

const apiRouter = express.Router()

const username_regex = /^\w[\w\.\- ]+$/
const ad = new AD({
    url: process.env.LDAP_SERVER_HOST,
    user: process.env.LDAP_BIND_USERNAME,
    pass: process.env.LDAP_BIND_PW
})

const ad2 = new AD({
    url: process.env.SECOND_LDAP_SERVER_HOST,
    user: process.env.SECOND_LDAP_BIND_USERNAME,
    pass: process.env.SECOND_LDAP_BIND_PW
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
    let username = anyToString(req.body.username)
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
        const r_username = await redisClient.GET('password_reset_code:' + code)

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

        const user2 = await findUser(username, process.env.SECOND_LDAP_SERVER_HOST, process.env.SECOND_LDAP_SEARCH_BASE_DN, process.env.SECOND_LDAP_BIND_USERNAME, process.env.SECOND_LDAP_BIND_PW)
        if (user2) {
            console.log("[SERVER 2] Changing password to", username, user2.dn)
            const r2 = await modifyPassword(user2.dn, password, process.env.SECOND_LDAP_SERVER_HOST, process.env.SECOND_LDAP_BIND_USERNAME, process.env.SECOND_LDAP_BIND_PW)
            console.log("[SERVER 2]", r2)
        }

        // modifyPassword()
        // Change the actual password
        // let ok = false
        // let i = 0
        // while (!ok) {
        //     try {
        //         await ad.user(username).password(password)
        //         ok = true
        //     } catch (error) {
        //         console.error("[Server 1] Changeing password try " + (i + 1) + " failed.")
        //         await delay(1200)
        //         if (i == 9) {
        //             throw error
        //         }
        //     }
        //     i++;
        // }

        // console.log("Password changed to", username)

        // ok = false
        // i = 0
        // while (!ok) {
        //     try {
        //         console.log("Trying to change password on second server")
        //         await ad2.user(username).password(password)
        //         ok = true
        //     } catch (error) {
        //         console.error("[Server 2] Changeing password try " + (i + 1) + " failed.")
        //         await delay(1200)
        //         if (i == 9) {
        //             throw error
        //         }
        //     }
        //     i++;
        // }

        // console.log("Password changed on second server to", username)

        // Delete code
        await redisClient.DEL('password_reset_code:' + code)

        // Send ok
        res.json('ok')
    } catch (error) {
        res.status(500).json("internal_error")
        console.error(error)
    }
})

function delay(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(() => { resolve() }, ms)
    })
}

module.exports = apiRouter