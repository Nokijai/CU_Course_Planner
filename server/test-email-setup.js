const emailService = require('./services/emailService');

async function testEmailSetup() {
  console.log('🧪 Testing Email Service Setup...\n');
  
  try {
    // Test connection
    console.log('1. Testing SMTP connection...');
    const isConnected = await emailService.testConnection();
    
    if (!isConnected) {
      console.log('❌ SMTP connection failed. Please check your configuration.');
      console.log('\n💡 Quick setup guide:');
      console.log('   - For Gmail: Enable 2FA and generate an App Password');
      console.log('   - Set environment variables: SMTP_USER, SMTP_PASS');
      console.log('   - See EMAIL_SETUP.md for detailed instructions');
      return;
    }
    
    console.log('✅ SMTP connection successful!\n');
    
    // Test sending email
    console.log('2. Testing email sending...');
    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    const result = await emailService.sendVerificationEmail(
      testEmail,
      'test-verification-token-123',
      'http://localhost:3002'
    );
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log(`📧 Check your email: ${testEmail}`);
      console.log('📧 Message ID:', result.messageId);
    } else {
      console.log('❌ Email sending failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check SMTP credentials in environment variables');
    console.log('2. Verify network connectivity');
    console.log('3. Check email provider settings');
    console.log('4. Review EMAIL_SETUP.md for configuration help');
  }
}

// Run the test
testEmailSetup(); 