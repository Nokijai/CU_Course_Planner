const nodemailer = require('nodemailer');
const config = require('../config/env');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  // Initialize email transporter
  initializeTransporter() {
    // Use real SMTP service for both development and production
    const smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      // Additional options for better reliability
      pool: true, // Use pooled connection
      maxConnections: 5, // Maximum number of connections
      maxMessages: 100, // Maximum number of messages per connection
      rateLimit: 14, // Maximum number of messages per second
    };

    // For Gmail, we need to use OAuth2 or App Password
    if (smtpConfig.host === 'smtp.gmail.com') {
      console.log('📧 Using Gmail SMTP service');
      // Gmail requires either OAuth2 or App Password
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️  Gmail SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS environment variables.');
        console.warn('💡 For Gmail, you need to:');
        console.warn('   1. Enable 2-factor authentication');
        console.warn('   2. Generate an App Password');
        console.warn('   3. Use the App Password as SMTP_PASS');
      }
    }

    this.transporter = nodemailer.createTransport(smtpConfig);
    
    // Test the connection
    this.transporter.verify()
      .then(() => {
        console.log('✅ Email service is ready and connected');
      })
      .catch((error) => {
        console.error('❌ Email service connection failed:', error.message);
        console.error('💡 Please check your SMTP configuration in environment variables');
      });
  }

  // Send verification email
  async sendVerificationEmail(email, verificationToken, baseUrl) {
    try {
      // For development, use a direct API call URL
      const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;
      
      const mailOptions = {
        from: process.env.SMTP_FROM || '"CUHK Course Planner" <noreply@cuhk-course-planner.com>',
        to: email,
        subject: 'Verify Your Email - CUHK Course Planner',
        html: this.getVerificationEmailTemplate(verificationUrl),
        text: this.getVerificationEmailText(verificationUrl)
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('Verification email sent:', info.messageId);
      
      // Log successful email sending
      console.log('✅ Verification email sent successfully to:', email);
      console.log('📧 Message ID:', info.messageId);
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  // HTML template for verification email
  getVerificationEmailTemplate(verificationUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #1e40af; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>CUHK Course Planner</h1>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Thank you for registering with CUHK Course Planner!</p>
            <p>Please click the button below to verify your email address:</p>
            <a href="${verificationUrl}" class="button">Verify Email</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p>This link will expire in 24 hours for security reasons.</p>
            <p>If you didn't create an account with CUHK Course Planner, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 CUHK Course Planner. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Plain text version of verification email
  getVerificationEmailText(verificationUrl) {
    return `
CUHK Course Planner - Verify Your Email Address

Thank you for registering with CUHK Course Planner!

Please click the link below to verify your email address:

${verificationUrl}

This link will expire in 24 hours for security reasons.

If you didn't create an account with CUHK Course Planner, you can safely ignore this email.

Best regards,
CUHK Course Planner Team
    `;
  }

  // Test email service
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service is ready and connected');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error.message);
      return false;
    }
  }
}

module.exports = new EmailService(); 