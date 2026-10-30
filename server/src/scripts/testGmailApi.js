import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getOAuth2Client, sendViaGmailApi, dispatchEmail, sendViaSmtp } from '../utils/sendEmail.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const recipient = process.argv[2] || process.env.TEST_RECIPIENT || process.env.EMAIL_USER || 'vcmforu@gmail.com';

console.log('='.repeat(60));
console.log('🛠️  StudyMate: Multi-Transport Email Diagnostics & Test Tool');
console.log('='.repeat(60));

console.log('1. Checking Environment Configurations:');
console.log(`   - GMAIL_CLIENT_ID     : ${process.env.GMAIL_CLIENT_ID ? '✅ Configured' : '❌ MISSING'}`);
console.log(`   - GMAIL_CLIENT_SECRET : ${process.env.GMAIL_CLIENT_SECRET ? '✅ Configured (Hidden)' : '❌ MISSING'}`);
console.log(`   - GMAIL_REFRESH_TOKEN : ${process.env.GMAIL_REFRESH_TOKEN ? '✅ Configured (Hidden)' : '❌ MISSING'}`);
console.log(`   - EMAIL_USER          : ${process.env.EMAIL_USER ? `✅ Configured (${process.env.EMAIL_USER})` : '❌ MISSING'}`);
console.log(`   - EMAIL_PASS (App Pwd): ${process.env.EMAIL_PASS ? '✅ Configured (Hidden)' : '❌ MISSING'}`);
console.log(`   - Target Recipient    : ${recipient}`);

console.log('\n2. Testing Unified Email Dispatcher (Gmail API with Automatic SMTP Fallback)...');

const testOtp = Math.floor(100000 + Math.random() * 900000).toString();

dispatchEmail({
  to: recipient,
  name: 'StudyMate Student',
  subject: `StudyMate Verification Code: ${testOtp}`,
  text: `Hello!\n\nYour StudyMate test verification code is: ${testOtp}\n\nTimestamp: ${new Date().toISOString()}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #0f172a; color: #f8fafc; border-radius: 12px;">
      <h2 style="color: #6366f1;">StudyMate Email Delivery Test</h2>
      <p>Congratulations! StudyMate email delivery is active and verified.</p>
      <div style="background: #1e1b4b; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <div style="font-size: 12px; color: #a5b4fc; margin-bottom: 6px;">TEST VERIFICATION CODE</div>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #ffffff;">${testOtp}</div>
      </div>
      <p style="font-size: 12px; color: #94a3b8;">Sent via StudyMate resilient email delivery system.</p>
    </div>
  `,
})
  .then((result) => {
    if (result.success) {
      console.log('\n✅ Test email delivered successfully!');
      console.log(`   - Message ID   : ${result.messageId}`);
      console.log(`   - Provider     : ${result.serviceName}`);
      console.log('\n🎉 ALL CHECKS PASSED: Email verification is 100% operational!');
      process.exit(0);
    } else {
      console.error('\n❌ Email Send Failed:');
      console.error(`   - Error Message: ${result.error}`);
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('\n❌ Unexpected Dispatcher Error:');
    console.error(`   ${err.message}`);
    process.exit(1);
  });

