const nodemailer = require('nodemailer')
// const testAccount = await nodemailer.createTestAccount(); // TESTING ONLY
// require('dotenv').config({ path: '../../../.env' }) // TEST ONLY

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE == 'true' || process.env.SMTP_SECURE == 'yes', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
    },
})

function sendMail(params) {
    return transporter.sendMail({
        from: process.env.SMTP_EMAIL_FROM, // sender address
        ...params,
        // to // list of receivers
        // subject // Subject line
        // text // plain text body
        // html // html body
    })
}

module.exports = sendMail
