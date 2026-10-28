import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure environment variables are loaded regardless of launch directory
dotenv.config({ path: path.resolve(__dirname, '../../../server/.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

/**
 * Strips wrapping quotes and whitespace from environment variable strings.
 */
const cleanEnv = (val) => {
  if (!val) return '';
  let str = String(val).trim();
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1).trim();
  }
  return str;
};

/**
 * Creates and configures the Google OAuth2 client for the Gmail API.
 */
export const getOAuth2Client = () => {
  const clientId = cleanEnv(process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID);
  const clientSecret = cleanEnv(process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET);
  const redirectUri = cleanEnv(
    process.env.GMAIL_REDIRECT_URI ||
    process.env.GOOGLE_REDIRECT_URI ||
    'https://developers.google.com/oauthplayground'
  );
  const refreshToken = cleanEnv(process.env.GMAIL_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN);

  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  // Detect placeholder values
  if (
    clientId.includes('your_') ||
    clientSecret.includes('your_') ||
    refreshToken.includes('your_') ||
    refreshToken === 'your_refresh_token_here'
  ) {
    console.warn('[Gmail API Service] OAuth environment variables contain placeholder text. Please provide real credentials.');
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
};

/**
 * Base64URL encoder conforming to RFC 4648 specification required by the Gmail API.
 */
const toBase64Url = (str) => {
  return Buffer.from(str, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Sends an email directly through the official Google Gmail REST API (users.messages.send)
 * over standard HTTPS port 443, completely bypassing cloud SMTP port blocks.
 */
export const sendViaGmailApi = async ({ to, name, subject, text, html }) => {
  // Automated Test Mock (Fast CI & avoids real quota usage during Jest tests)
  if (process.env.NODE_ENV === 'test' && process.env.TEST_REAL_EMAIL !== 'true') {
    return {
      success: true,
      emailDelivered: true,
      messageId: `test-gmail-${Date.now()}`,
      isLive: true,
      serviceName: 'Gmail API (Jest Test Mode)',
    };
  }

  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) {
    const errorMsg =
      'Gmail API credentials are not configured. Please set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN in your environment.';
    console.warn(`[Gmail API Service Warning] ${errorMsg}`);
    return {
      success: false,
      emailDelivered: false,
      error: errorMsg,
      category: 'CONFIG_MISSING',
    };
  }

  const senderEmail = cleanEnv(
    process.env.GMAIL_SENDER_EMAIL ||
    process.env.EMAIL_USER ||
    'aiinterviewbotvk@gmail.com'
  );
  const senderName = cleanEnv(process.env.GMAIL_SENDER_NAME || process.env.EMAIL_FROM_NAME || 'StudyMate Platform');
  const recipientName = name ? `"${name.replace(/"/g, '')}"` : 'Student';

  // Construct standard RFC 2822 / MIME multipart alternative message
  const boundary = `__studymate_boundary_${Date.now().toString(16)}__`;
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=`;

  const mimeLines = [
    `From: "${senderName}" <${senderEmail}>`,
    `To: ${recipientName} <${to}>`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    text,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    html,
    '',
    `--${boundary}--`,
  ];

  const rawMessage = mimeLines.join('\r\n');
  const encodedRaw = toBase64Url(rawMessage);

  try {
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedRaw,
      },
    });

    const messageId = response.data.id;
    console.log(`[Gmail API Service] Email delivered to ${to}. Message ID: ${messageId}`);

    return {
      success: true,
      emailDelivered: true,
      messageId,
      threadId: response.data.threadId,
      isLive: true,
      serviceName: 'Google Gmail API (OAuth 2.0 / HTTPS)',
    };
  } catch (error) {
    let errorCategory = 'UNKNOWN';
    let userFriendlyMsg = error.message;

    const errMsgLower = (error.message || '').toLowerCase();
    const errDataLower = JSON.stringify(error.response?.data || {}).toLowerCase();

    if (errMsgLower.includes('invalid_grant') || errDataLower.includes('invalid_grant')) {
      errorCategory = 'TOKEN_EXPIRED_OR_REVOKED';
      userFriendlyMsg = 'Google OAuth refresh token is invalid, revoked, or expired. Please re-authorize in Google OAuth Playground.';
    } else if (errMsgLower.includes('invalid_client') || errDataLower.includes('invalid_client')) {
      errorCategory = 'INVALID_CLIENT';
      userFriendlyMsg = 'Google OAuth Client ID or Client Secret is incorrect.';
    } else if (errDataLower.includes('insufficientpermissions') || errDataLower.includes('insufficient scope')) {
      errorCategory = 'INSUFFICIENT_PERMISSIONS';
      userFriendlyMsg = 'Gmail OAuth scope https://www.googleapis.com/auth/gmail.send was not authorized.';
    } else if (error.code === 403 || errDataLower.includes('quotaexceeded')) {
      errorCategory = 'QUOTA_EXCEEDED';
      userFriendlyMsg = 'Daily Gmail API sending quota exceeded (standard limit: 500 emails/day).';
    }

    console.error(`[Gmail API Service Error - ${errorCategory}] Failed dispatching to ${to}:`, userFriendlyMsg);

    return {
      success: false,
      emailDelivered: false,
      error: userFriendlyMsg,
      category: errorCategory,
      rawError: error.message,
    };
  }
};

/**
 * Sends a 6-digit OTP verification email for account registration.
 */
export const sendVerificationEmail = async ({ to, name, otp }) => {
  const subject = `${otp} is your StudyMate verification code`;
  const frontendUrl = cleanEnv(
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    'https://studymate-h7r1.onrender.com'
  );
  const verifyLink = `${frontendUrl}/verify-email?email=${encodeURIComponent(to)}&code=${otp}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1120; color: #f8fafc; margin: 0; padding: 24px; }
          .container { max-width: 540px; margin: 0 auto; background: #0f172a; border-radius: 16px; border: 1px solid #1e293b; padding: 36px 28px; }
          .header { text-align: center; margin-bottom: 24px; }
          .logo { display: inline-block; width: 48px; height: 48px; line-height: 48px; background: linear-gradient(135deg, #6366f1, #3b82f6); border-radius: 12px; font-size: 24px; font-weight: bold; color: white; text-align: center; }
          .title { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 16px; margin-bottom: 6px; }
          .subtitle { font-size: 14px; color: #94a3b8; margin: 0; }
          .code-box { background: #1e1b4b; border: 1px dashed #6366f1; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0; }
          .code-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #a5b4fc; margin-bottom: 8px; font-weight: 600; }
          .otp-code { font-size: 38px; font-weight: 800; letter-spacing: 0.25em; color: #ffffff; font-family: monospace; }
          .btn-container { text-align: center; margin: 24px 0; }
          .verify-btn { display: inline-block; background: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 14px; }
          .info { font-size: 13px; color: #94a3b8; line-height: 1.6; text-align: center; }
          .security-note { margin-top: 24px; padding-top: 16px; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">S</div>
            <h1 class="title">Verify Your StudyMate Account</h1>
            <p class="subtitle">Hi ${name || 'Student'}, verify your email to access study groups and resources.</p>
          </div>
          <div class="code-box">
            <div class="code-label">6-Digit One-Time Passcode (OTP)</div>
            <div class="otp-code">${otp}</div>
          </div>
          <div class="btn-container">
            <a href="${verifyLink}" class="verify-btn" target="_blank">Verify Email Instantly</a>
          </div>
          <p class="info">
            Enter this 6-digit code in the StudyMate portal, or click the button above.
            This code will expire in <strong>15 minutes</strong>.
          </p>
          <div class="security-note">
            If you did not sign up for StudyMate, please ignore this email. Never share this code with anyone.
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `Hi ${name || 'Student'},\n\nYour StudyMate verification code is: ${otp}\n\nVerify online: ${verifyLink}\n\nThis 6-digit code expires in 15 minutes.\n\nBest regards,\nThe StudyMate Team`;

  const result = await sendViaGmailApi({
    to,
    name,
    subject,
    text: textContent,
    html: htmlContent,
  });

  return { ...result, otp };
};

/**
 * Sends a 6-digit OTP email for password reset.
 */
export const sendPasswordResetEmail = async ({ to, name, otp }) => {
  const subject = `${otp} is your StudyMate password reset code`;
  const frontendUrl = cleanEnv(
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    'https://studymate-h7r1.onrender.com'
  );
  const resetLink = `${frontendUrl}/forgot-password?email=${encodeURIComponent(to)}&token=${otp}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1120; color: #f8fafc; margin: 0; padding: 24px; }
          .container { max-width: 540px; margin: 0 auto; background: #0f172a; border-radius: 16px; border: 1px solid #1e293b; padding: 36px 28px; }
          .header { text-align: center; margin-bottom: 24px; }
          .logo { display: inline-block; width: 48px; height: 48px; line-height: 48px; background: linear-gradient(135deg, #f59e0b, #ef4444); border-radius: 12px; font-size: 24px; font-weight: bold; color: white; text-align: center; }
          .title { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 16px; margin-bottom: 6px; }
          .subtitle { font-size: 14px; color: #94a3b8; margin: 0; }
          .code-box { background: #451a03; border: 1px dashed #f59e0b; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0; }
          .code-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #fcd34d; margin-bottom: 8px; font-weight: 600; }
          .otp-code { font-size: 38px; font-weight: 800; letter-spacing: 0.25em; color: #ffffff; font-family: monospace; }
          .btn-container { text-align: center; margin: 24px 0; }
          .reset-btn { display: inline-block; background: #dc2626; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 14px; }
          .info { font-size: 13px; color: #94a3b8; line-height: 1.6; text-align: center; }
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
          <div class="btn-container">
            <a href="${resetLink}" class="reset-btn" target="_blank">Reset Password Now</a>
          </div>
          <p class="info">
            Enter this 6-digit code or click the button above to reset your password.
            This code will expire in <strong>15 minutes</strong>.
          </p>
          <div class="security-note">
            ⚠️ If you did not request a password reset, please ignore this email. Your account remains completely secure.
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `Hi ${name || 'Student'},\n\nYour StudyMate password reset code is: ${otp}\n\nReset online: ${resetLink}\n\nThis 6-digit code expires in 15 minutes.\n\nIf you did not request this, you can safely ignore this email.\n\nBest regards,\nThe StudyMate Team`;

  const result = await sendViaGmailApi({
    to,
    name,
    subject,
    text: textContent,
    html: htmlContent,
  });

  return { ...result, otp };
};
