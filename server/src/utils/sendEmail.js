import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Ensure environment variables are loaded regardless of launch directory
dotenv.config({ path: path.resolve(__dirname, '../../../server/.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const cleanEnv = (val) => {
  if (!val) return '';
  let str = String(val).trim();
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1).trim();
  }
  return str;
};

/**
 * Creates and configures the nodemailer transporter.
 * Supports Gmail (via direct IPv4 SMTP on port 465 / 587), custom SMTP, or test fallback.
 */
const getTransporter = async () => {
  const user = cleanEnv(process.env.EMAIL_USER || process.env.SMTP_USER);
  const rawPass = cleanEnv(process.env.EMAIL_PASS || process.env.SMTP_PASS);
  const pass = rawPass ? rawPass.replace(/\s+/g, '') : '';
  const host = cleanEnv(process.env.SMTP_HOST);
  const port = Number(cleanEnv(process.env.SMTP_PORT)) || 587;
  const service = cleanEnv(process.env.EMAIL_SERVICE || process.env.SMTP_SERVICE);
  const isGmail =
    service.toLowerCase() === 'gmail' ||
    (host && host.toLowerCase().includes('gmail')) ||
    (user && user.toLowerCase().endsWith('@gmail.com'));

  let rawFrom = cleanEnv(process.env.EMAIL_FROM || process.env.FROM_EMAIL);
  if ((rawFrom.startsWith('"') && rawFrom.endsWith('"')) || (rawFrom.startsWith("'") && rawFrom.endsWith("'"))) {
    const inner = rawFrom.slice(1, -1).trim();
    if (inner.includes('<') && inner.includes('>')) {
      rawFrom = inner;
    }
  }

  const fromAddress =
    rawFrom ||
    (user ? `"StudyMate Platform" <${user}>` : '"StudyMate Platform" <no-reply@studymate.internal>');

  // 0. Automated Test Mock (keeps Jest test suite fast and avoids hitting Gmail rate limits during CI/testing)
  if (process.env.NODE_ENV === 'test' && process.env.TEST_REAL_EMAIL !== 'true') {
    return {
      transporter: {
        sendMail: async () => ({
          messageId: `<test-${Date.now()}@studymate.internal>`,
          response: '250 Test OK',
        }),
      },
      from: fromAddress,
      isLive: false,
      serviceName: 'Test Environment',
    };
  }

  // 1. Live Gmail App Password transport with IPv4 enforcement & rapid fallback
  if (user && pass && isGmail) {
    const primaryTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
      family: 4, // Force IPv4 to prevent hanging on cloud containers without IPv6 routing
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
      tls: {
        rejectUnauthorized: false,
      },
    });

    return {
      transporter: primaryTransporter,
      fallbackPort: 587,
      user,
      pass,
      from: fromAddress,
      isLive: true,
      serviceName: 'Gmail SMTP (Port 465, IPv4)',
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
        family: 4,
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 10000,
        tls: { rejectUnauthorized: false },
      }),
      from: process.env.FROM_EMAIL || `"StudyMate Platform" <${user}>`,
      isLive: true,
      serviceName: `SMTP (${host}:${port})`,
    };
  }

  // Log clear diagnostic warning if credentials are not configured
  console.warn(
    '[Email Service Warning] EMAIL_USER / EMAIL_PASS environment variables are not set in the hosting environment. ' +
      'If running in production (e.g. Render/Railway), please add EMAIL_USER and EMAIL_PASS to your dashboard Environment Variables.'
  );

  // 3. Fallback: Ethereal test account or offline simulation
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
      family: 4,
      connectionTimeout: 5000,
    });

    return {
      transporter: testTransporter,
      from: '"StudyMate Notifications" <verify@studymate.internal>',
      isLive: false,
      isTestAccount: true,
      serviceName: 'Ethereal Test Inbox',
    };
  } catch {
    return {
      transporter: null,
      from: '"StudyMate" <no-reply@studymate.internal>',
      isLive: false,
      serviceName: 'Console Simulation',
    };
  }
};

/**
 * Cloud HTTP-based email provider (Resend / Brevo).
 * Communicates over standard HTTPS (Port 443), completely bypassing Render's SMTP port blocks.
 */
const sendViaHttpsProvider = async ({ to, name, subject, text, html }) => {
  const resendKey = cleanEnv(process.env.RESEND_API_KEY);
  if (resendKey) {
    const rawFrom = cleanEnv(process.env.EMAIL_FROM || process.env.RESEND_FROM || 'StudyMate <onboarding@resend.dev>');
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: rawFrom,
        to: [to],
        subject,
        html,
        text,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Resend API Error: ${res.statusText}`);
    }
    console.log(`[Email Service (Resend HTTPS API)] Email delivered to ${to}. MessageId: ${data.id}`);
    return {
      success: true,
      emailDelivered: true,
      messageId: data.id,
      isLive: true,
      serviceName: 'Resend Cloud API (HTTPS)',
    };
  }

  const brevoKey = cleanEnv(process.env.BREVO_API_KEY);
  if (brevoKey) {
    const senderEmail = cleanEnv(process.env.EMAIL_USER || process.env.BREVO_SENDER_EMAIL || 'aiinterviewbotvk@gmail.com');
    const senderName = cleanEnv(process.env.BREVO_SENDER_NAME || 'StudyMate Platform');
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to, name: name || 'Student' }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Brevo API Error: ${res.statusText}`);
    }
    console.log(`[Email Service (Brevo HTTPS API)] Email delivered to ${to}. MessageId: ${data.messageId}`);
    return {
      success: true,
      emailDelivered: true,
      messageId: data.messageId,
      isLive: true,
      serviceName: 'Brevo Cloud API (HTTPS)',
    };
  }

  return null;
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

  const mailOptions = {
    to,
    subject,
    text: textContent,
    html: htmlContent,
  };

  // 1. HTTPS Cloud API (Bypasses Render/cloud SMTP port blocks on port 465/587)
  try {
    const httpsResult = await sendViaHttpsProvider({
      to,
      name,
      subject,
      text: textContent,
      html: htmlContent,
    });
    if (httpsResult) {
      return { ...httpsResult, otp };
    }
  } catch (httpsErr) {
    console.warn(`[Email Service] HTTPS provider error (${httpsErr.message}). Attempting SMTP fallback...`);
  }

  try {
    const config = await getTransporter();

    if (config.transporter) {
      mailOptions.from = config.from;

      let info;
      try {
        info = await config.transporter.sendMail(mailOptions);
      } catch (primaryErr) {
        // If primary port 465 timed out or failed, try port 587 with STARTTLS
        if (config.fallbackPort && config.user && config.pass) {
          console.warn(`[Email Service] Port 465 delivery attempt failed (${primaryErr.message}). Attempting port 587 STARTTLS...`);
          const fallbackTransporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: { user: config.user, pass: config.pass },
            family: 4,
            connectionTimeout: 8000,
            greetingTimeout: 8000,
            socketTimeout: 10000,
            tls: { rejectUnauthorized: false },
          });
          info = await fallbackTransporter.sendMail(mailOptions);
        } else {
          throw primaryErr;
        }
      }

      let previewUrl = null;
      if (config.isTestAccount) {
        previewUrl = nodemailer.getTestMessageUrl(info);
      }

      console.log(`[Email Service (${config.serviceName})] Verification email delivered to ${to}. MessageId: ${info.messageId}`);
      if (previewUrl) {
        console.log(`[Email Service Preview URL]: ${previewUrl}`);
      }

      return {
        success: true,
        emailDelivered: Boolean(config.isLive),
        messageId: info.messageId,
        isLive: Boolean(config.isLive),
        previewUrl,
        otp,
      };
    }
  } catch (err) {
    console.error(`[Email Service Error] Failed sending to ${to}:`, err.message);
    return {
      success: false,
      emailDelivered: false,
      error: err.message,
      simulated: true,
      otp,
    };
  }

  // Terminal dev fallback log
  console.log('\n' + '='.repeat(68));
  console.log('📧 [StudyMate Email Service] Verification Code Dispatched:');
  console.log(`   Recipient : ${to} (${name || 'Student'})`);
  console.log(`   Subject   : ${subject}`);
  console.log(`   🔑 OTP CODE: [ ${otp} ] (Valid for 15 minutes)`);
  console.log('='.repeat(68) + '\n');

  return { success: false, emailDelivered: false, simulated: true, otp };
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

  const mailOptions = {
    to,
    subject,
    text: textContent,
    html: htmlContent,
  };

  // 1. HTTPS Cloud API (Bypasses Render/cloud SMTP port blocks on port 465/587)
  try {
    const httpsResult = await sendViaHttpsProvider({
      to,
      name,
      subject,
      text: textContent,
      html: htmlContent,
    });
    if (httpsResult) {
      return { ...httpsResult, otp };
    }
  } catch (httpsErr) {
    console.warn(`[Email Service] HTTPS provider error (${httpsErr.message}). Attempting SMTP fallback...`);
  }

  try {
    const config = await getTransporter();

    if (config.transporter) {
      mailOptions.from = config.from;

      let info;
      try {
        info = await config.transporter.sendMail(mailOptions);
      } catch (primaryErr) {
        if (config.fallbackPort && config.user && config.pass) {
          console.warn(`[Email Service] Port 465 delivery attempt failed (${primaryErr.message}). Attempting port 587 STARTTLS...`);
          const fallbackTransporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: { user: config.user, pass: config.pass },
            family: 4,
            connectionTimeout: 8000,
            greetingTimeout: 8000,
            socketTimeout: 10000,
            tls: { rejectUnauthorized: false },
          });
          info = await fallbackTransporter.sendMail(mailOptions);
        } else {
          throw primaryErr;
        }
      }

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
        emailDelivered: Boolean(config.isLive),
        messageId: info.messageId,
        isLive: Boolean(config.isLive),
        previewUrl,
        otp,
      };
    }
  } catch (err) {
    console.error(`[Email Service Error] Failed sending password reset to ${to}:`, err.message);
    return {
      success: false,
      emailDelivered: false,
      error: err.message,
      simulated: true,
      otp,
    };
  }

  // Terminal dev fallback
  console.log('\n' + '='.repeat(68));
  console.log('🔑 [StudyMate Email Service] Password Reset Code Dispatched:');
  console.log(`   Recipient : ${to} (${name || 'Student'})`);
  console.log(`   Subject   : ${subject}`);
  console.log(`   🔑 OTP CODE: [ ${otp} ] (Valid for 15 minutes)`);
  console.log('='.repeat(68) + '\n');

  return { success: false, emailDelivered: false, simulated: true, otp };
};
