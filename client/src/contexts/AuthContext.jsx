import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          // You can add a verify token endpoint here if needed
          // For now, we'll just check if token exists
          setUser({ token }); // Simplified for now
        } catch (error) {
          console.error('Auth check failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.success) {
        setUser(data.data.user);
        setToken(data.data.token);
        localStorage.setItem('authToken', data.data.token);
        toast.success('Login successful!');
        return { success: true };
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      toast.error(error.message || 'Login failed');
      return { success: false, error: error.message };
    }
  };

  const register = async (email, password) => {
    try {
      console.log('Making registration request...', { email });
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('Registration response status:', response.status);
      const data = await response.json();
      console.log('Registration response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      if (data.success) {
        toast.success('Registration successful! Please check your email to verify your account.');
        return { success: true };
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed');
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    toast.success('Logged out successfully');
  };

  const resendVerification = async (email) => {
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend verification');
      }

      if (data.success) {
        toast.success('Verification email sent successfully!');
        return { success: true };
      } else {
        throw new Error(data.message || 'Failed to resend verification');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to resend verification');
      return { success: false, error: error.message };
    }
  };

  const verifyEmail = async (email, code) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      if (data.success) {
        // After successful verification, automatically log the user in
        // We'll need to get the user's password or create a session
        // For now, we'll set a basic user state
        const verifiedUser = {
          email: email,
          isEmailVerified: true,
          verifiedAt: new Date()
        };
        setUser(verifiedUser);
        toast.success('Email verified successfully! You are now logged in.');
        return { success: true, user: verifiedUser };
      } else {
        throw new Error(data.message || 'Verification failed');
      }
    } catch (error) {
      toast.error(error.message || 'Verification failed');
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    resendVerification,
    verifyEmail,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 