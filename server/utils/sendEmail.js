const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  // If SMTP isn't configured, log instead of throwing - keeps dev flow unblocked.
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log('--- EMAIL (SMTP not configured, logging only) ---');
    console.log('To:', to, '\nSubject:', subject, '\nHTML:', html);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.FROM_EMAIL || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
