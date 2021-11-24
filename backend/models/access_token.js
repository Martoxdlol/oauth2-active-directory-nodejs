const mongoose = require('mongoose');
const generate_access_token_key = require('../src/util/generate_access_token_key');
const { Schema } = mongoose;

const access_token_schema = new Schema({
    access_token: {
        type: String,
        required: true,
        unique: true,
        default: generate_access_token_key
    },
    scope: [{
        type: String
    }],
    username: { type: String, required: true },
    client_id: { type: String, required: true },
})

const AccessToken = mongoose.model('AccessToken', access_token_schema)

module.exports = AccessToken