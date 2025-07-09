import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1); // 1: email, 2: verification, 3: new password
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const navigate = useNavigate();

  // Timer countdown
  React.useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (step === 2 && timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft, step]);

  // Handle code input
  const handleCodeChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Step 1: Request password reset
  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Verification code sent to your email!');
        setStep(2);
        setTimeLeft(60);
        setCanResend(false);
      } else {
        toast.error(data.message || 'Failed to send verification code');
      }
    } catch (error) {
      toast.error('Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify code
  const handleVerifyCode = async () => {
    const code = verificationCode.join('');
    if (code.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Code verified successfully!');
        setStep(3);
      } else {
        toast.error(data.message || 'Invalid verification code');
      }
    } catch (error) {
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Password validation function
  const validatePassword = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasMinLength = password.length >= 6;

    const errors = [];
    if (!hasMinLength) errors.push('at least 6 characters');
    if (!hasUpperCase) errors.push('1 uppercase letter');
    if (!hasLowerCase) errors.push('1 lowercase letter');
    if (!hasDigit) errors.push('1 digit');

    return {
      isValid: hasUpperCase && hasLowerCase && hasDigit && hasMinLength,
      errors,
      checks: {
        hasMinLength,
        hasUpperCase,
        hasLowerCase,
        hasDigit
      }
    };
  };

  // Step 3: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      const errorMessage = `Password must contain: ${passwordValidation.errors.join(', ')}`;
      toast.error(errorMessage);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Password reset successfully! You can now log in with your new password.');
        navigate('/login');
      } else {
        toast.error(data.message || 'Failed to reset password');
      }
    } catch (error) {
      toast.error('Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend code
  const handleResend = async () => {
    if (!canResend) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setTimeLeft(60);
        setCanResend(false);
        setVerificationCode(['', '', '', '', '', '']);
        toast.success('New verification code sent!');
      } else {
        toast.error(data.message || 'Failed to resend code');
      }
    } catch (error) {
      toast.error('Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BookOpen className="h-16 w-16 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Reset Password
          </h1>
          <p className="text-blue-100">
            {step === 1 && 'Enter your email to receive a verification code'}
            {step === 2 && 'Enter the 6-digit code sent to your email'}
            {step === 3 && 'Create your new password'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Step 1: Email Input */}
          {step === 1 && (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{isLoading ? 'Sending...' : 'Send Verification Code'}</span>
              </button>
            </form>
          )}

          {/* Step 2: Verification Code */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Email Display */}
              <div className="flex items-center justify-center mb-6 p-3 bg-blue-50 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-blue-800 font-medium">{email}</span>
              </div>

              {/* Code Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Enter 6-digit verification code
                </label>
                <div className="flex justify-center space-x-2">
                  {verificationCode.map((digit, index) => (
                    <input
                      key={index}
                      id={`code-${index}`}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                      placeholder="0"
                    />
                  ))}
                </div>
              </div>

              {/* Timer */}
              <div className="text-center mb-6">
                {timeLeft > 0 ? (
                  <p className="text-sm text-gray-600">
                    Code expires in <span className="font-semibold text-red-600">{timeLeft}s</span>
                  </p>
                ) : (
                  <p className="text-sm text-red-600 font-semibold">
                    Code expired
                  </p>
                )}
              </div>

              {/* Verify Button */}
              <button
                onClick={handleVerifyCode}
                disabled={isLoading || verificationCode.join('').length !== 6}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mb-4"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{isLoading ? 'Verifying...' : 'Verify Code'}</span>
              </button>

              {/* Resend Code */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Didn't receive the code?
                </p>
                <button
                  onClick={handleResend}
                  disabled={!canResend || isLoading}
                  className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {canResend ? 'Resend Code' : `Resend in ${timeLeft}s`}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter new password (6+ chars, 1 upper, 1 lower, 1 digit)"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="mt-2 p-3 bg-blue-50 rounded-md">
                  <p className="text-xs text-blue-800 font-medium mb-2">Password Requirements:</p>
                  <div className="space-y-1">
                    <div className={`flex items-center text-xs ${validatePassword(newPassword).checks.hasMinLength ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">
                        {validatePassword(newPassword).checks.hasMinLength ? '✓' : '○'}
                      </span>
                      At least 6 characters long
                    </div>
                    <div className={`flex items-center text-xs ${validatePassword(newPassword).checks.hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">
                        {validatePassword(newPassword).checks.hasUpperCase ? '✓' : '○'}
                      </span>
                      At least 1 uppercase letter (A-Z)
                    </div>
                    <div className={`flex items-center text-xs ${validatePassword(newPassword).checks.hasLowerCase ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">
                        {validatePassword(newPassword).checks.hasLowerCase ? '✓' : '○'}
                      </span>
                      At least 1 lowercase letter (a-z)
                    </div>
                    <div className={`flex items-center text-xs ${validatePassword(newPassword).checks.hasDigit ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">
                        {validatePassword(newPassword).checks.hasDigit ? '✓' : '○'}
                      </span>
                      At least 1 digit (0-9)
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm new password"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || newPassword !== confirmPassword || !validatePassword(newPassword).isValid}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{isLoading ? 'Resetting...' : 'Reset Password'}</span>
              </button>
            </form>
          )}

          {/* Back to Login */}
          <div className="text-center mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-800 font-medium mx-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Login</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 