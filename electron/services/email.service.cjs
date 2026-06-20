const nodemailer = require('nodemailer');
const Setting = require('../db/models/Setting.cjs');
const { encryptSensitive, decryptSensitive } = require('../utils/sensitiveEncryption.cjs');

async function getTransporter() {
    const smtpHost = await Setting.findOne({ key: 'smtp_host' });
    const smtpPort = await Setting.findOne({ key: 'smtp_port' });
    const smtpUser = await Setting.findOne({ key: 'smtp_user' });
    const smtpPass = await Setting.findOne({ key: 'smtp_pass' });
    const smtpFrom = await Setting.findOne({ key: 'smtp_from' });

    if (!smtpHost?.value || !smtpUser?.value) {
        throw new Error('SMTP not configured');
    }

    // Decrypt password if it's encrypted
    const decryptedPass = smtpPass?.value ? decryptSensitive(smtpPass.value) || smtpPass.value : '';

    return {
        transporter: nodemailer.createTransport({
            host: smtpHost.value,
            port: parseInt(smtpPort?.value || 587),
            secure: parseInt(smtpPort?.value) === 465,
            auth: {
                user: smtpUser.value,
                pass: decryptedPass,
            },
        }),
        from: smtpFrom?.value || smtpUser.value
    };
}

async function sendEmail({ to, subject, html, attachments = [] }) {
    const { transporter, from } = await getTransporter();

    return await transporter.sendMail({
        from,
        to,
        subject,
        html,
        attachments
    });
}

async function testEmail(config) {
    const transporter = nodemailer.createTransport({
        host: config.host,
        port: parseInt(config.port),
        secure: parseInt(config.port) === 465,
        auth: {
            user: config.user,
            pass: config.pass,
        },
    });

    return await transporter.verify();
}

module.exports = { sendEmail, testEmail };
