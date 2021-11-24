const mongoose = require('mongoose');
const { make_secure_secret } = require('../util/generate_keys');
const { Schema } = mongoose;

const access_token_schema = new Schema({
    access_token: {
        type: String,
        required: true,
        unique: true,
        default: make_secure_secret
    },
    scope: [{
        type: String
    }],
    username: { type: String, required: true },
    redirect_uri: { type: String, required: true },
    client: { type: mongoose.Types.ObjectId, required: true },
})

const AccessToken = mongoose.model('AccessToken', access_token_schema)

module.exports = AccessToken