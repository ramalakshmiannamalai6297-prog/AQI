const nodemailer = require("nodemailer");

function isMailConfigured() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  return Boolean(host && user && pass);
}

let transporter = null;

function getTransporter() {
  if (!isMailConfigured()) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  if (!isMailConfigured()) {
    console.log("Email not configured, skipping");
    return { configured: false, sent: false };
  }

  try {
    const mailer = getTransporter();
    const fromAddress = process.env.MAIL_FROM || process.env.SMTP_USER;
    
    const info = await mailer.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html: html || text
    });

    console.log(`Email alert sent to ${to}: ${info.messageId}`);
    return { configured: true, sent: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);
    return { configured: true, sent: false, error: error.message };
  }
}

module.exports = {
  isMailConfigured,
  sendMail
};
