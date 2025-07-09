import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Mail, ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const EmailVerificationPage = () => {
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { resendVerification, verifyEmail } = useAuth();
  
  const email = location.state?.email;

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

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

  // Verify code
  const handleVerify = async () => {
    const code = verificationCode.join('');
    if (code.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyEmail(email, code);
      
      if (result.success) {
        // User is now verified and logged in, redirect to home page
        navigate('/');
      } else {
        toast.error(result.error || 'Verification failed');
      }
    } catch (error) {
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend code
  const handleResend = async () => {
    if (!canResend) return;
    
    setIsLoading(true);
    try {
      const result = await resendVerification(email);
      if (result.success) {
        setTimeLeft(60);
        setCanResend(false);
        setVerificationCode(['', '', '', '', '', '']);
        toast.success('New verification code sent!');
      }
    } catch (error) {
      toast.error('Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center px-4">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Invalid Access</h1>
          <p className="mb-6">Please register first to verify your email.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BookOpen className="h-16 w-16 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Verify Your Email
          </h1>
          <p className="text-blue-100">
            We've sent a 6-digit code to <strong>{email}</strong>
          </p>
        </div>

        {/* Verification Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
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
            onClick={handleVerify}
            disabled={isLoading || verificationCode.join('').length !== 6}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mb-4"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{isLoading ? 'Verifying...' : 'Verify Email'}</span>
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

export default EmailVerificationPage; 