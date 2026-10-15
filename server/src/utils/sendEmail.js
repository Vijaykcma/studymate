import nodemailer from 'nodemailer';

/**
 * Creates and configures the nodemailer transporter.
 * Supports Gmail (via service: 'gmail'), custom SMTP, or automatic test accounts.
 */
const getTransporter = async () => {
  const user = process.env.SMTP_USER?.trim();
  const rawPass = process.env.SMTP_PASS?.trim();
  const pass = rawPass ? rawPass.replace(/\s+/g, '') : '';
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT) || 587;
  const isGmail =
    process.env.SMTP_SERVICE?.toLowerCase() === 'gmail' ||
    (host && host.toLowerCase().includes('gmail')) ||
    (user && user.toLowerCase().endsWith('@gmail.com'));

  // 1. Live Gmail App Password transport
  if (user && pass && isGmail) {
    return {
      transporter: nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      }),
      from: process.env.FROM_EMAIL || `"StudyMate Platform" <${user}>`,
      isLive: true,
      serviceName: 'Gmail SMTP',
    };
  }

  // 2. Custom SMTP Server transport
  if (user && pass && host) {
    return {
      transporter: nodemailer.createTransport({
        host,
        port,
        secure: port === 465 || process.env.SMTP_SECURE === 'true',
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
      }),
      from: process.env.FROM_EMAIL || `"StudyMate Platform" <${user}>`,
      isLive: true,
      serviceName: `SMTP (${host}:${port})`,
    };
  }

  // 3. Fallback: Ethereal real test account dispatch or simulation
  try {
    const testAccount = await nodemailer.createTestAccount();
    const testTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    return {
      transporter: testTransporter,
      from: '"StudyMate Notifications" <verify@studymate.internal>',
      isLive: false,
      isTestAccount: true,
      serviceName: 'Ethereal Test Inbox',
    };
  } catch {
    // Pure offline fallback
    return {
      transporter: null,
      from: '"StudyMate" <no-reply@studymate.internal>',
      isLive: false,
      serviceName: 'Console Simulation',
    };
  }
};

/**
 * Sends a real 6-digit OTP verification email for account registration.
 */
export const sendVerificationEmail = async ({ to, name, otp }) => {
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

  const textContent = `Hi ${name || 'Student'},\n\nYour StudyMate verification code is: ${otp}\n\nThis 6-digit code is valid for 15 minutes. Enter it to verify that you are an authorized real user.\n\nBest regards,\nThe StudyMate Team`;

  try {
    const config = await getTransporter();

    if (config.transporter) {
      const info = await config.transporter.sendMail({
        from: config.from,
        to,
        subject,
        text: textContent,
        html: htmlContent,
      });

      let previewUrl = null;
      if (config.isTestAccount) {
        previewUrl = nodemailer.getTestMessageUrl(info);
      }

      console.log(`[Email Service (${config.serviceName})] Verification email sent to ${to}. MessageId: ${info.messageId}`);
      if (previewUrl) {
        console.log(`[Email Service Preview URL]: ${previewUrl}`);
      }

      return {
        success: true,
        messageId: info.messageId,
        isLive: config.isLive,
        previewUrl,
        otp,
      };
    }
  } catch (err) {
    console.error(`[Email Service Error] Failed sending to ${to}: ${err.message}`);
  }

  // Terminal dev fallback
  console.log('\n' + '='.repeat(68));
  console.log('📧 [StudyMate Email Service] Verification Code Dispatched:');
  console.log(`   Recipient : ${to} (${name || 'Student'})`);
  console.log(`   Subject   : ${subject}`);
  console.log(`   🔑 OTP CODE: [ ${otp} ] (Valid for 15 minutes)`);
  console.log('='.repeat(68) + '\n');

  return { success: true, simulated: true, otp };
};

/**
 * Sends a real 6-digit OTP email for password reset.
 */
export const sendPasswordResetEmail = async ({ to, name, otp }) => {
  const subject = `${otp} is your StudyMate password reset code`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #020617; color: #f8fafc; margin: 0; padding: 24px; }
          .container { max-width: 540px; margin: 0 auto; background: #0f172a; border-radius: 16px; border: 1px solid #1e293b; padding: 36px 28px; }
          .header { text-align: center; margin-bottom: 24px; }
          .logo { display: inline-block; width: 48px; height: 48px; line-height: 48px; background: linear-gradient(135deg, #f59e0b, #ef4444); border-radius: 12px; font-size: 24px; font-weight: bold; color: white; text-align: center; }
          .title { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 16px; margin-bottom: 6px; }
          .subtitle { font-size: 14px; color: #94a3b8; margin: 0; }
          .code-box { background: #451a03; border: 1px dashed #f59e0b; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0; }
          .code-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #fcd34d; margin-bottom: 8px; font-weight: 600; }
          .otp-code { font-size: 38px; font-weight: 800; letter-spacing: 0.25em; color: #ffffff; font-family: monospace; }
          .info { font-size: 13px; color: #94a3b8; line-height: 1.6; }
          .security-note { margin-top: 24px; padding-top: 16px; border-top: 1px solid #1e293b; font-size: 12px; color: #ef4444; text-align: center; font-weight: 500; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔑</div>
            <h1 class="title">Reset Your StudyMate Password</h1>
            <p class="subtitle">Hi ${name || 'Student'}, you requested to reset your password.</p>
          </div>
          <div class="code-box">
            <div class="code-label">6-Digit Password Reset Code</div>
            <div class="otp-code">${otp}</div>
          </div>
          <p class="info">
            Enter this 6-digit code along with your new password to complete the password reset process.
            This code will expire in <strong>15 minutes</strong> for security reasons.
          </p>
          <div class="security-note">
            ⚠️ If you did not request a password reset, please ignore this email. Your account remains completely secure.
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `Hi ${name || 'Student'},\n\nYour StudyMate password reset code is: ${otp}\n\nThis 6-digit code is valid for 15 minutes. Enter it to reset your password.\n\nIf you did not request this, you can safely ignore this email.\n\nBest regards,\nThe StudyMate Team`;

  try {
    const config = await getTransporter();

    if (config.transporter) {
      const info = await config.transporter.sendMail({
        from: config.from,
        to,
        subject,
        text: textContent,
        html: htmlContent,
      });

      let previewUrl = null;
      if (config.isTestAccount) {
        previewUrl = nodemailer.getTestMessageUrl(info);
      }

      console.log(`[Email Service (${config.serviceName})] Password reset email sent to ${to}. MessageId: ${info.messageId}`);
      if (previewUrl) {
        console.log(`[Email Service Preview URL]: ${previewUrl}`);
      }

      return {
        success: true,
        messageId: info.messageId,
        isLive: config.isLive,
        previewUrl,
        otp,
      };
    }
  } catch (err) {
    console.error(`[Email Service Error] Failed sending password reset to ${to}: ${err.message}`);
  }

  // Terminal dev fallback
  console.log('\n' + '='.repeat(68));
  console.log('🔑 [StudyMate Email Service] Password Reset Code Dispatched:');
  console.log(`   Recipient : ${to} (${name || 'Student'})`);
  console.log(`   Subject   : ${subject}`);
  console.log(`   🔑 OTP CODE: [ ${otp} ] (Valid for 15 minutes)`);
  console.log('='.repeat(68) + '\n');

  return { success: true, simulated: true, otp };
};
