const { authenticate } = require('ldap-authentication')
exports.validateUserCredentials = async function validateUserCredentials(username, password) {
    try {
        // auth with admin
        let options = {
            ldapOpts: {
                url: process.env.LDAP_SERVER_HOST,
                // tlsOptions: { rejectUnauthorized: false }
            },
            adminDn: process.env.LDAP_BIND_DN,
            adminPassword: process.env.LDAP_BIND_PW,
            userPassword: password,
            userSearchBase: process.env.LDAP_SEARCH_BASE_DN,
            usernameAttribute: process.env.USERNAME_ATTRIBUTE,
            username: username,
            // starttls: false
        }

        const user = await authenticate(options)
        if (!user) {
            throw new Error()
        }
        return [user, null]
    } catch (error) {
        return [null, error]
    }
}