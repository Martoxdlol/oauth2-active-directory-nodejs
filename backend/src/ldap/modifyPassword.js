const ldap = require('ldapjs')

function modifyPassword(userDN, newPassword, server, bindUserDN, bindUserPassword) {
    const ldapClient = ldap.createClient({
        url: [server]
    })
    return new Promise((resolve, reject) => {

        try {
            //ldapClient.bind(userDN, oldPassword, err => {
            ldapClient.bind(bindUserDN, bindUserPassword, err => {
                if (err) {
                    reject(err);
                }

                const change = new ldap.Change({
                    operation: 'replace',
                    modification: { unicodePwd: encodePassword(newPassword) },
                })

                ldapClient.modify(userDN, change, (error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve('Successfully password modified.')
                    }
                })
            })
        } catch (error) {
            console.error(error)
            reject(error)
        }
    })
}

function encodePassword(str) {
    var output = '';
    str = '"' + str + '"';

    for (var i = 0; i < str.length; i++) {
        output += String.fromCharCode(str.charCodeAt(i) & 0xFF, (str.charCodeAt(i) >>> 8) & 0xFF);
    }

    return output;
}

module.exports = modifyPassword