const Oauth2Client = require('../models/oauth2_clients')

class LoginAttempt {
    constructor({ client_id, login, scope, state, require_groups, exclude_groups, redirect_uri, key }) {
        this.client_id = client_id
        this.login = login
        this.scope = scope
        this.state = state
        this.require_groups = require_groups
        this.exclude_groups = exclude_groups
        this.redirect_uri = redirect_uri
        this.key = key
    }

    async validate() {
        try {
            const client = await Oauth2Client.findOne({ client_id: this.client_id })
            if (!client) {
                throw 401
            }
            const max_groups = new Set(client.max_groups)
            const max_scope = new Set(client.max_scope)
            const redirect_uris = new Set(client.redirect_uris)
            // If is requiring a group that is not in max groups it will fail
            if (this.require_groups.length) {
                for (const group of this.require_groups) {
                    if (!max_groups.has(group)) {
                        throw 403
                    }
                }
            }
            // IF is requering more access than max allowed it will fail
            if (this.scope.length) {
                for (const scope_item of this.scope) {
                    if (!max_scope.has(scope_item)) {
                        throw 403
                    }
                }
            }
            // redirect_uri must be on client config
            if (!redirect_uris.has(this.redirect_uri)) {
                throw 403
            }
        } catch (e) {
            return false
        }
        return true
    }

}

module.exports = LoginAttempt