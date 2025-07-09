const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const emailService = require('../services/emailService');
const { generateVerificationCode } = require('../utils/tokenGenerator');
const config = require('../config/env');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user and send verification email (user not saved until verified)
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 60 * 1000); // 1 minute

    // Store registration data temporarily (in memory or cache)
    // For now, we'll use a simple approach with a temporary user document
    // In production, you might want to use Redis or another cache
    const tempUser = new User({
      email: email.toLowerCase(),
      password,
      verificationCode,
      verificationCodeExpires,
      isEmailVerified: false
    });

    // Save temporarily - this will be cleaned up if not verified
    await tempUser.save();

    // Send verification email
    try {
      await emailService.sendVerificationEmail(email, verificationCode);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Clean up the temporary user if email fails
      await User.findByIdAndDelete(tempUser._id);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Verification code sent to your email. Please verify your email to complete registration.',
      data: {
        email: tempUser.email,
        isEmailVerified: false
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify user's email using 6-digit code
 * @access  Public
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;

    console.log('Verification request:', { email, code });

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required'
      });
    }

    // Find user by verification code
    const user = await User.findByVerificationCode(code);
    console.log('Found user by code:', user ? { id: user._id, email: user.email } : 'No user found');

    if (!user || user.email !== email.toLowerCase()) {
      console.log('Verification failed:', { 
        userFound: !!user, 
        userEmail: user?.email, 
        requestEmail: email.toLowerCase(),
        emailMatch: user?.email === email.toLowerCase()
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Verify the email and complete registration
    user.isEmailVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    user.createdAt = new Date(); // Set the actual creation date after verification
    await user.save();

    // Generate JWT token for automatic login
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Email verified successfully! Registration completed.',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin
        }
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user (only if email is verified)
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend verification email
 * @access  Public
 */
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 60 * 1000); // 1 minute

    // Update user with new code
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    await user.save();

    // Send verification email
    try {
      await emailService.sendVerificationEmail(email, verificationCode);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      });
    }

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset verification code
 * @access  Public
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate password reset code
    const resetCode = generateVerificationCode();
    const resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with reset code
    user.passwordResetCode = resetCode;
    user.passwordResetCodeExpires = resetCodeExpires;
    await user.save();

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(email, resetCode);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email'
      });
    }

    res.json({
      success: true,
      message: 'Password reset code sent to your email'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/auth/verify-reset-code
 * @desc    Verify password reset code
 * @access  Public
 */
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required'
      });
    }

    // Find user by email and reset code
    const user = await User.findOne({
      email: email.toLowerCase(),
      passwordResetCode: code,
      passwordResetCodeExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code'
      });
    }

    res.json({
      success: true,
      message: 'Reset code verified successfully'
    });

  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with new password
 * @access  Public
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, verification code, and new password are required'
      });
    }

    // Find user by email and reset code
    const user = await User.findOne({
      email: email.toLowerCase(),
      passwordResetCode: code,
      passwordResetCodeExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code'
      });
    }

    // Update password
    user.password = newPassword;
    user.passwordResetCode = null;
    user.passwordResetCodeExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/auth/cleanup-unverified
 * @desc    Cleanup unverified users (admin/internal use)
 * @access  Public
 */
router.post('/cleanup-unverified', async (req, res) => {
  try {
    const result = await User.cleanupUnverifiedUsers();
    
    res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} unverified users`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 