import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getOAuth2Client, sendViaGmailApi } from '../utils/sendEmail.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const recipient = process.argv[2] || process.env.TEST_RECIPIENT || process.env.EMAIL_USER || 'vcmforu@gmail.com';

console.log('='.repeat(60));
console.log('🛠️  StudyMate: Gmail API Diagnostics & Test Tool');
console.log('='.repeat(60));

console.log('1. Checking Environment Variables:');
console.log(`   - GMAIL_CLIENT_ID     : ${process.env.GMAIL_CLIENT_ID ? '✅ Configured' : '❌ MISSING'}`);
console.log(`   - GMAIL_CLIENT_SECRET : ${process.env.GMAIL_CLIENT_SECRET ? '✅ Configured (Hidden)' : '❌ MISSING'}`);
console.log(`   - GMAIL_REFRESH_TOKEN : ${process.env.GMAIL_REFRESH_TOKEN ? '✅ Configured (Hidden)' : '❌ MISSING'}`);
console.log(`   - GMAIL_SENDER_EMAIL  : ${process.env.GMAIL_SENDER_EMAIL || process.env.EMAIL_USER || 'Not set (will default to auth user)'}`);
console.log(`   - Target Recipient    : ${recipient}`);

const oauth2Client = getOAuth2Client();
if (!oauth2Client) {
  console.error('\n❌ ERROR: Gmail OAuth credentials are incomplete or contain placeholder text.');
  console.error('Please configure GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN.');
  process.exit(1);
}

console.log('\n2. Testing OAuth2 Token Exchange...');
oauth2Client
  .getAccessToken()
  .then(({ token }) => {
    if (!token) {
      throw new Error('Failed to retrieve access token from Google OAuth2 server.');
    }
    console.log('   ✅ Access token generated successfully!');
    console.log('\n3. Dispatching Test Email via Gmail API (HTTPS Port 443)...');

    const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
    return sendViaGmailApi({
      to: recipient,
      name: 'Test Recipient',
      subject: `StudyMate Gmail API Test Code: ${testOtp}`,
      text: `Hello!\n\nThis is a diagnostic verification test from StudyMate's Gmail API integration.\n\nYour test verification code is: ${testOtp}\n\nTimestamp: ${new Date().toISOString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #0f172a; color: #f8fafc; border-radius: 12px;">
          <h2 style="color: #6366f1;">StudyMate Gmail API Live Test</h2>
          <p>Congratulations! Your Gmail API integration is working correctly over HTTPS.</p>
          <div style="background: #1e1b4b; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <div style="font-size: 12px; color: #a5b4fc; margin-bottom: 6px;">TEST VERIFICATION CODE</div>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #ffffff;">${testOtp}</div>
          </div>
          <p style="font-size: 12px; color: #94a3b8;">Sent from StudyMate platform via Google OAuth 2.0.</p>
        </div>
      `,
    });
  })
  .then((result) => {
    if (result.success) {
      console.log('   ✅ Test email sent successfully!');
      console.log(`   - Message ID   : ${result.messageId}`);
      console.log(`   - Service Name : ${result.serviceName}`);
      console.log('\n🎉 ALL CHECKS PASSED: Gmail API is completely ready for production!');
      process.exit(0);
    } else {
      console.error('\n❌ Email Send Failed:');
      console.error(`   - Error Category : ${result.category}`);
      console.error(`   - Error Message  : ${result.error}`);
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('\n❌ OAuth2 / Gmail API Error:');
    console.error(`   ${err.message}`);
    process.exit(1);
  });
