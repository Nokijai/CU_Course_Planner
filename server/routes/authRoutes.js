const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PendingRegistration = require('../models/PendingRegistration');
const emailService = require('../services/emailService');
const { generateVerificationCode } = require('../utils/tokenGenerator');
const config = require('../config/env');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user and send verification email
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

    // Check if user already exists (both in User and PendingRegistration)
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    const existingPending = await PendingRegistration.findOne({ email: email.toLowerCase() });
    
    if (existingUser || existingPending) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 60 * 1000); // 1 minute

    // Create pending registration (not actual user yet)
    const pendingRegistration = new PendingRegistration({
      email: email.toLowerCase(),
      password,
      verificationCode,
      verificationCodeExpires
    });

    await pendingRegistration.save();

    // Send verification email
    try {
      await emailService.sendVerificationEmail(email, verificationCode);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Clean up pending registration if email fails
      await PendingRegistration.findByIdAndDelete(pendingRegistration._id);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration initiated. Please check your email to verify your account.',
      data: {
        email: pendingRegistration.email,
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
 * @desc    Verify user's email using 6-digit code and create actual user
 * @access  Public
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required'
      });
    }

    // Find pending registration by verification code
    const pendingRegistration = await PendingRegistration.findByVerificationCode(code);

    if (!pendingRegistration || pendingRegistration.email !== email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    // Check if user already exists (in case of race condition)
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      // Clean up pending registration
      await PendingRegistration.findByIdAndDelete(pendingRegistration._id);
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create the actual user
    const user = new User({
      email: pendingRegistration.email,
      password: pendingRegistration.password, // Already hashed
      isEmailVerified: true,
      createdAt: new Date()
    });

    await user.save();

    // Clean up pending registration
    await PendingRegistration.findByIdAndDelete(pendingRegistration._id);

    res.json({
      success: true,
      message: 'Email verified successfully! You can now log in to your account.'
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

    // Find pending registration
    const pendingRegistration = await PendingRegistration.findOne({ email: email.toLowerCase() });
    if (!pendingRegistration) {
      return res.status(404).json({
        success: false,
        message: 'No pending registration found for this email'
      });
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 60 * 1000); // 1 minute

    // Update pending registration with new verification code
    pendingRegistration.verificationCode = verificationCode;
    pendingRegistration.verificationCodeExpires = verificationCodeExpires;
    await pendingRegistration.save();

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

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate reset verification code
    const resetCode = generateVerificationCode();
    const resetCodeExpires = new Date(Date.now() + 60 * 1000); // 1 minute

    // Update user with reset code
    user.resetCode = resetCode;
    user.resetCodeExpires = resetCodeExpires;
    await user.save();

    // Send reset email
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
      message: 'Password reset code sent successfully'
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

    // Find user by reset code
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      resetCode: code,
      resetCodeExpires: { $gt: new Date() }
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
 * @desc    Reset user password
 * @access  Public
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email and new password are required'
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

    // Update password
    user.password = newPassword;
    user.resetCode = null;
    user.resetCodeExpires = null;
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

module.exports = router; 