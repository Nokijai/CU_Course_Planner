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
  async sendVerificationEmail(email, verificationCode) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || '"CUHK Course Planner" <noreply@cuhk-course-planner.com>',
        to: email,
        subject: 'Verify Your Email - CUHK Course Planner',
        html: this.getVerificationEmailTemplate(verificationCode),
        text: this.getVerificationEmailText(verificationCode)
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

  // Send password reset email
  async sendPasswordResetEmail(email, resetCode) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || '"CUHK Course Planner" <noreply@cuhk-course-planner.com>',
        to: email,
        subject: 'Reset Your Password - CUHK Course Planner',
        html: this.getPasswordResetEmailTemplate(resetCode),
        text: this.getPasswordResetEmailText(resetCode)
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('Password reset email sent:', info.messageId);
      
      // Log successful email sending
      console.log('✅ Password reset email sent successfully to:', email);
      console.log('📧 Message ID:', info.messageId);
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }
 

  // HTML template for verification email
  getVerificationEmailTemplate(verificationCode) {
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
          .code { font-size: 32px; font-weight: bold; color: #1e40af; text-align: center; padding: 20px; background: #e5e7eb; border-radius: 8px; margin: 20px 0; letter-spacing: 4px; }
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
            <p>Your verification code is:</p>
            <div class="code">${verificationCode}</div>
            <p><strong>Please enter this code in the verification page within 1 minute.</strong></p>
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
  getVerificationEmailText(verificationCode) {
    return `
CUHK Course Planner - Verify Your Email Address

Thank you for registering with CUHK Course Planner!

Your verification code is: ${verificationCode}

Please enter this code in the verification page within 1 minute.

If you didn't create an account with CUHK Course Planner, you can safely ignore this email.

Best regards,
CUHK Course Planner Team
    `;
  }

  // HTML template for password reset email
  getPasswordResetEmailTemplate(resetCode) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .code { font-size: 32px; font-weight: bold; color: #1e40af; text-align: center; padding: 20px; background: #e5e7eb; border-radius: 8px; margin: 20px 0; letter-spacing: 4px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>CUHK Course Planner</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>You requested to reset your password for CUHK Course Planner.</p>
            <p>Your reset code is:</p>
            <div class="code">${resetCode}</div>
            <p><strong>Please enter this code in the password reset page within 1 minute.</strong></p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 CUHK Course Planner. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Plain text version of password reset email
  getPasswordResetEmailText(resetCode) {
    return `
CUHK Course Planner - Reset Your Password

You requested to reset your password for CUHK Course Planner.

Your reset code is: ${resetCode}

Please enter this code in the password reset page within 1 minute.

If you didn't request a password reset, you can safely ignore this email.

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