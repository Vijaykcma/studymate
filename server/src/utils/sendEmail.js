import nodemailer from 'nodemailer';

/**
 * Sends a transactional verification email or logs it to console in development.
 * Supports real SMTP servers (Gmail, SendGrid, Mailgun, Amazon SES) when configured in .env.
 */
export const sendVerificationEmail = async ({ to, name, otp }) => {
  const isConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

  const subject = `${otp} is your StudyMate verification code`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #020617; color: #f8fafc; margin: 0; padding: 24px; }
          .container { max-width: 540px; margin: 0 auto; background: #0f172a; border-radius: 16px; border: 1px solid #1e293b; padding: 36px 28px; }
          .header { text-align: center; margin-bottom: 24px; }
          .logo { display: inline-block; width: 48px; height: 48px; line-height: 48px; background: linear-gradient(135deg, #6366f1, #06b6d4); border-radius: 12px; font-size: 24px; font-weight: bold; color: white; text-align: center; }
          .title { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 16px; margin-bottom: 6px; }
          .subtitle { font-size: 14px; color: #94a3b8; margin: 0; }
          .code-box { background: #1e1b4b; border: 1px dashed #6366f1; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0; }
          .code-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #a5b4fc; margin-bottom: 8px; font-weight: 600; }
          .otp-code { font-size: 38px; font-weight: 800; letter-spacing: 0.25em; color: #ffffff; font-family: monospace; }
          .info { font-size: 13px; color: #94a3b8; line-height: 1.6; }
          .security-note { margin-top: 24px; padding-top: 16px; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">S</div>
            <h1 class="title">Verify Your StudyMate Account</h1>
            <p class="subtitle">Hi ${name || 'Student'}, verify your email to become an authorized member.</p>
          </div>
          <div class="code-box">
            <div class="code-label">6-Digit One-Time Passcode (OTP)</div>
            <div class="otp-code">${otp}</div>
          </div>
          <p class="info">
            Enter this 6-digit verification code in the StudyMate verification portal to confirm that this is your real, authorized email address.
            This code will expire in <strong>15 minutes</strong>.
          </p>
          <div class="security-note">
            If you did not create an account on StudyMate, you can safely ignore this email. Never share this code with anyone.
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `Hi ${name || 'Student'},\n\nYour StudyMate verification code is: ${otp}\n\nThis 6-digit code is valid for 15 minutes. Enter it to verify that you are an authorized and real user.\n\nBest regards,\nThe StudyMate Team`;

  if (isConfigured) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: process.env.FROM_EMAIL || `"StudyMate Platform" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text: textContent,
        html: htmlContent,
      });

      console.log(`[Email Service] Verification OTP sent to ${to}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[Email Service Error] Failed to send via SMTP: ${err.message}. Falling back to simulation.`);
    }
  }

  // Development / Local Test Fallback (Console output)
  console.log('\n' + '='.repeat(68));
  console.log('📧 [StudyMate Email Service] Verification Code Dispatched:');
  console.log(`   Recipient : ${to} (${name || 'Student'})`);
  console.log(`   Subject   : ${subject}`);
  console.log(`   🔑 OTP CODE: [ ${otp} ] (Valid for 15 minutes)`);
  console.log('='.repeat(68) + '\n');

  return { success: true, simulated: true, otp };
};
