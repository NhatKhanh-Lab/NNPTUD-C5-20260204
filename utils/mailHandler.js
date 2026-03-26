const nodemailer = require("nodemailer");

function createTransporter() {
    let user = process.env.MAILTRAP_USER;
    let pass = process.env.MAILTRAP_PASS;

    if (!user || !pass) {
        throw new Error("Missing MAILTRAP_USER or MAILTRAP_PASS environment variables");
    }

    return nodemailer.createTransport({
        host: process.env.MAILTRAP_HOST || "sandbox.smtp.mailtrap.io",
        port: Number(process.env.MAILTRAP_PORT || 2525),
        secure: false,
        auth: {
            user: user,
            pass: pass,
        },
    });
}

module.exports = {
    sendMail: async function (to, url) {
        const transporter = createTransporter();
        const info = await transporter.sendMail({
            from: process.env.MAIL_FROM || "no-reply@nnptud-c5.local",
            to: to,
            subject: "Reset password URL",
            text: "Click vao day de doi password: " + url,
            html: 'Click vao <a href="' + url + '">day</a> de doi password',
        });

        console.log("Message sent:", info.messageId);
        return info;
    },
    sendUserPasswordMail: async function (to, username, password) {
        const transporter = createTransporter();
        const info = await transporter.sendMail({
            from: process.env.MAIL_FROM || "no-reply@nnptud-c5.local",
            to: to,
            subject: "Thong tin tai khoan cua ban",
            text:
                "Tai khoan cua ban da duoc tao.\n" +
                "Username: " + username + "\n" +
                "Password: " + password + "\n" +
                "Role: USER",
            html:
                "<h3>Tai khoan cua ban da duoc tao</h3>" +
                "<p><strong>Username:</strong> " + username + "</p>" +
                "<p><strong>Password:</strong> " + password + "</p>" +
                "<p><strong>Role:</strong> USER</p>",
        });

        console.log("User credential email sent:", info.messageId);
        return info;
    }
}
