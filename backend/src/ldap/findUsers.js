const ldap = require('ldapjs');

function findUsers(LDAP_SERVER_HOST, BASE_DN, LDAP_BIND_DN, LDAP_BIND_PW) {
    let resolved = false
    return new Promise((resolve, reject) => {

        // Create client and bind to AD
        const client = ldap.createClient({
            url: [LDAP_SERVER_HOST]
        })

        client.bind(LDAP_BIND_DN, LDAP_BIND_PW, err => {
            if (err) reject(err)
        })

        // Search AD for user
        const searchOptions = {
            scope: "sub",
            filter: `(sAMAccountName=*)`
        }

        client.search(BASE_DN, searchOptions, (err, res) => {
            res.on('searchEntry', entry => {
                resolved = true
                resolve(entry.object)
            })
            res.on('searchReference', referral => {
                // console.log('referral: ' + referral.uris.join())
            })
            res.on('error', err => {
                // console.error('error: ' + err.message)
                if (err) reject(err)
            })
            res.on('end', result => {
                if (!resolved) resolve(null)
                // console.log(result)
                // resolve(result)
            })
        })

        // Wrap up
        client.unbind(err => {
            console.error(err)
        })
    })
}


module.exports = findUsers