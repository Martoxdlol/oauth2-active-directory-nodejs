const { uuid: uuidv4 } = require('uuidv4')
const crypto = require('crypto')

exports.make_secure_secret = function make_secure_secret() {
    return crypto.randomBytes(36).toString('hex')
}

exports.make_id = function make_id() {
    return uuidv4()
}

exports.make_short_id = function make_short_id() {
    return crypto.randomBytes(12).toString('hex')
}