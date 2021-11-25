require('dotenv').config({ path: '../dev.env' })

console.log("************************* ENV *************************")
console.log(process.env)
console.log("*******************************************************")


const express = require("express")
const path = require('path')
const apiRouter = require("./api/api")
const db = require("./db")
const oauth2Router = require("./oauth2/oauth2")
const createAndSetSession = require("./session")

const prod = process.env.NODE_ENV == 'production'
const WORKDIR_PATH = process.env.WORKDIR_PATH


// Use only on development
if (!prod && !process.env.AUTH_SERVER_HOST) process.env.AUTH_SERVER_HOST = 'localhost:8080'
if (!prod && !process.env.ALLOW_KEEP_LOGGED_USERS) process.env.ALLOW_KEEP_LOGGED_USERS = 'true'
if (!process.env.REDIS_PREFIX) process.env.REDIS_PREFIX = ''
if (!process.env.ACCESS_TOKEN_DURATION) process.env.ACCESS_TOKEN_DURATION = 10 * 60
if (!process.env.RESET_PASSWORD_LINK_DURATION) process.env.RESET_PASSWORD_LINK_DURATION = 10 * 60


async function main() {
    console.log("Starting auth server...");

    // Wait mongoose to connect
    await db
    console.log("Database OK")

    // Express APP
    const app = express()

    // Replacement to body-parser
    app.use(express.urlencoded())
    app.use(express.json())

    // Make and set express-session with redis
    createAndSetSession(app)

    // users api entries
    app.use("/api", apiRouter)

    // oauth2 entries
    app.use("/oauth2", oauth2Router)

    // Dev tool to check where is running
    app.get("/node_env", (req, res) => res.send(process.env.NODE_ENV + " " + process.env.WORKDIR_PATH))

    if (prod) {
        // If is production use builded files
        app.use(express.static(path.join(WORKDIR_PATH, 'auth-app/build')))
    } else {
        // If is development use react dev server
        const { createProxyMiddleware } = require('http-proxy-middleware')
        app.use(createProxyMiddleware({ target: 'http://localhost:3000', changeOrigin: true, ws: true }));
    }

    // We can use same port with prod and dev, idc
    app.listen(8080)

    console.log("Auth server listening on port 8080");
}

main()