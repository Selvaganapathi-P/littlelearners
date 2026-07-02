const nodemailer = require('nodemailer');

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[Email skipped — no SMTP config] To: ${to} | Subject: ${subject}`);
    return;
  }
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `LittleLearners <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

async function sendPasswordReset({ name, email, resetUrl }) {
  await sendEmail({
    to: email,
    subject: 'Reset your LittleLearners password 🔑',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#FF6B9D;margin-bottom:4px;">Reset your password 🔑</h2>
        <p style="color:#374151;">Hi ${name},</p>
        <p style="color:#6b7280;">Someone requested a password reset for your LittleLearners account.
        Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${resetUrl}"
            style="display:inline-block;padding:14px 28px;background:#FF6B9D;color:white;
                   border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;">
            Reset My Password →
          </a>
        </div>
        <p style="color:#9ca3af;font-size:13px;">
          If you didn't request this, you can safely ignore this email.<br/>
          Your password won't change unless you click the link above.
        </p>
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;"/>
        <p style="color:#d1d5db;font-size:12px;text-align:center;">
          LittleLearners — Joyful Learning for LKG & UKG
        </p>
      </div>
    `,
  });
}

module.exports = { sendEmail, sendPasswordReset };
