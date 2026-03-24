const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = `"Vamppe" <${process.env.SMTP_USER}>`;
const CLIENT = process.env.CLIENT_URL || 'http://localhost:5173';

exports.sendVerificationEmail = async (email, token) => {
  const link = `${CLIENT}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Verify your Vamppe account',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0a0a0f;color:#e5e7eb;padding:40px 32px;border-radius:16px;border:1px solid rgba(255,255,255,0.08)">
        <div style="text-align:center;margin-bottom:28px">
          <div style="display:inline-flex;align-items:center;gap:10px">
            <div style="width:36px;height:36px;background:linear-gradient(135deg,#f97316,#8b5cf6);border-radius:10px"></div>
            <span style="font-size:22px;font-weight:800;color:#fff">Vamppe</span>
          </div>
        </div>
        <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px">Confirm your email</h2>
        <p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:0 0 28px">
          Thanks for signing up. Click the button below to verify your email address and activate your account.
        </p>
        <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:12px;text-decoration:none">
          Verify email address
        </a>
        <p style="color:#6b7280;font-size:12px;margin-top:28px">
          This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
        <p style="color:#4b5563;font-size:11px;margin-top:8px;word-break:break-all">
          Or copy this link: ${link}
        </p>
      </div>
    `,
  });
};
