const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    index: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    match: [/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, 'Password must contain at least one uppercase letter, one lowercase letter, and one digit']
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String,
    default: null
  },
  verificationCodeExpires: {
    type: Date,
    default: null
  },
  passwordResetCode: {
    type: String,
    default: null
  },
  passwordResetCodeExpires: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: null // Will be set after email verification
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ verificationCode: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if verification code is expired
userSchema.methods.isVerificationCodeExpired = function() {
  if (!this.verificationCodeExpires) return true;
  return Date.now() > this.verificationCodeExpires.getTime();
};

// Static method to find user by verification code
userSchema.statics.findByVerificationCode = function(code) {
  console.log('Searching for user with code:', code);
  const query = { 
    verificationCode: code,
    verificationCodeExpires: { $gt: Date.now() }
  };
  console.log('Query:', query);
  return this.findOne(query);
};

// Static method to cleanup unverified users
userSchema.statics.cleanupUnverifiedUsers = function() {
  const cutoffTime = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
  return this.deleteMany({
    isEmailVerified: false,
    createdAt: null,
    verificationCodeExpires: { $lt: cutoffTime }
  });
};

module.exports = mongoose.model('User', userSchema); 