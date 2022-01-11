const nodemailer = require("nodemailer");
module.exports = async ({ from, to, subject, text, html }) => {
        let transporter = nodemailer.createTransport({
            host: process.env.SMTP_SERVER_HOST,
            port: process.env.SMTP_SERVER_PORT,
            secure: false, 
            auth: {
                user: process.env.MAIL_USER, // generated ethereal user
                pass: process.env.MAIL_PASSWORD, // generated ethereal password
            }
        });

        // send mail with defined transport object
    let info = await transporter.sendMail({
        from: `Rocket Share <${from}>`, // sender address
        to: to, // list of receivers
        subject: subject, // Subject line
        text: text, // plain text body
        html: html, // html body
    });
}

module.exports = transporter;