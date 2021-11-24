const mongoose = require('mongoose');
const { make_id, make_secure_secret } = require('../util/generate_keys');
const { Schema } = mongoose;

const oauth2_client = new Schema({
    client_id: {
        type: String,
        unique: true,
        default: make_id,
        required: true,
    },
    client_secret: {
        type: String,
        unique: true,
        default: make_secure_secret,
        required: true,
    },
    aplication_name: {
        type: String,
        unique: true,
        required: true, 
    },
    username: {
        type: String,
        unique: true,
        required: true, 
    },
    redirect_uris: [{
        type: String,
        required: true,
    }],
    max_scope: [{ // Unimplemented yet
        type: String,
        required: true,
    }],
    max_groups: [{ // Unimplemented yet
        type: String,
        required: true,
    }],
    metadata: {}
})

const Oauth2Client = mongoose.model('Oauth2Client', oauth2_client)

module.exports = Oauth2Client