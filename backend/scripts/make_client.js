const db = require('../src/db')
const Oauth2Client = require('../src/models/oauth2_clients')

async function main() {
    await db
    const client = new Oauth2Client({
        aplication_name: 'ETHF Auth System',
        username: 'self',
        redirect_uris: ['https://localhost:8080/', 'auth.henryford.edu.ar'],
        max_scope: [],
        max_groups: [],
    })
    client.save()
}

main()