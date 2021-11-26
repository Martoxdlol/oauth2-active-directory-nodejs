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

function encodePassword(password) {
    return new Buffer('"' + password + '"', 'utf16le').toString();
}
/*
function encodePassword(password) {
    let newPassword = '';
    password = "\"" + password + "\"";
    for (let i = 0; i < password.length; i++) {
        newPassword += String.fromCharCode(password.charCodeAt(i) & 0xFF, (password.charCodeAt(i) >>> 8) & 0xFF);
    }
    return newPassword;
}*/

module.exports = modifyPassword