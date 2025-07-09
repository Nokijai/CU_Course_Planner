const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const pendingRegistrationSchema = new mongoose.Schema({
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
    validate: {
      validator: function(password) {
        // Check minimum length
        if (password.length < 6) {
          return false;
        }
        // Check for at least one uppercase letter
        if (!/[A-Z]/.test(password)) {
          return false;
        }
        // Check for at least one lowercase letter
        if (!/[a-z]/.test(password)) {
          return false;
        }
        // Check for at least one digit
        if (!/\d/.test(password)) {
          return false;
        }
        return true;
      },
      message: 'Password must be at least 6 characters long and contain at least 1 uppercase letter, 1 lowercase letter, and 1 digit'
    }
  },
  verificationCode: {
    type: String,
    required: true
  },
  verificationCodeExpires: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // Auto-delete after 5 minutes
  }
}, {
  timestamps: true
});

// Index for faster queries
pendingRegistrationSchema.index({ verificationCode: 1 });
pendingRegistrationSchema.index({ email: 1 });

// Pre-save middleware to hash password
pendingRegistrationSchema.pre('save', async function(next) {
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

// Method to compare password
pendingRegistrationSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Static method to find by verification code
pendingRegistrationSchema.statics.findByVerificationCode = function(code) {
  return this.findOne({
    verificationCode: code,
    verificationCodeExpires: { $gt: new Date() }
  });
};

module.exports = mongoose.model('PendingRegistration', pendingRegistrationSchema); 