# Authentication System Documentation

This document describes the complete user authentication system with email verification for the CUHK Course Planner.

## Features

- ✅ User registration with email verification
- ✅ Secure password hashing with bcrypt
- ✅ JWT-based authentication
- ✅ Email verification with secure tokens
- ✅ Token expiration handling
- ✅ Comprehensive error handling
- ✅ Development and production email configurations

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the server directory with the following variables:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/cuhk-course-planner

# JWT Secret (change this in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (for production)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="CUHK Course Planner <noreply@cuhk-course-planner.com>"

# Development Email (optional - uses Ethereal Email for testing)
ETHEREAL_USER=test@ethereal.email
ETHEREAL_PASS=test123
```

### 2. MongoDB Setup

Make sure MongoDB is running on your system:

```bash
# Start MongoDB (Ubuntu/Debian)
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 3. Install Dependencies

```bash
cd server
npm install
```

## API Endpoints

### Authentication Routes

#### POST /api/auth/register
Register a new user and send verification email.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email to verify your account.",
  "data": {
    "email": "user@example.com",
    "isEmailVerified": false
  }
}
```

#### GET /api/auth/verify-email?token=...
Verify user's email using the token from the verification email.

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully! You can now log in to your account."
}
```

#### POST /api/auth/login
Login user (only works if email is verified).

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "isEmailVerified": true,
      "lastLogin": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

#### POST /api/auth/resend-verification
Resend verification email if the original expired.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

## Database Schema

### User Model

```javascript
{
  email: String (unique, required, validated),
  password: String (hashed, required, min 6 chars),
  isEmailVerified: Boolean (default: false),
  verificationToken: String (nullable),
  verificationTokenExpires: Date (nullable),
  createdAt: Date (auto),
  lastLogin: Date (nullable),
  timestamps: true
}
```

## Security Features

### Password Security
- Passwords are hashed using bcrypt with a cost factor of 12
- Minimum password length of 6 characters
- Password comparison is done securely

### Token Security
- Verification tokens are 64-character random hex strings
- Tokens expire after 24 hours
- JWT tokens expire after 7 days
- Secure token generation using Node.js crypto module

### Email Security
- Email addresses are validated using regex
- Email addresses are stored in lowercase
- Verification tokens are single-use

## Error Handling

The system provides comprehensive error handling with appropriate HTTP status codes:

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid credentials, unverified email)
- `403` - Forbidden (email verification required)
- `404` - Not Found (user not found)
- `409` - Conflict (user already exists)
- `500` - Internal Server Error

## Development vs Production

### Development Mode
- Uses Ethereal Email for fake SMTP testing
- Logs email preview URLs to console
- More verbose error messages

### Production Mode
- Uses real SMTP service (Gmail, SendGrid, etc.)
- Secure error messages
- Environment-specific configurations

## Usage Examples

### Frontend Integration

```javascript
// Register a new user
const registerUser = async (email, password) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
};

// Login user
const loginUser = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
};

// Use JWT token for authenticated requests
const getProtectedData = async (token) => {
  const response = await fetch('/api/protected-route', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
};
```

### Protected Routes

To protect routes that require authentication:

```javascript
const { authenticateToken } = require('../middleware/authMiddleware');

// Protected route example
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'This is a protected route',
    user: req.user
  });
});
```

## Testing

### Manual Testing

1. **Register a new user:**
   ```bash
   curl -X POST http://localhost:3002/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

2. **Check verification email** (in development, check console for Ethereal Email preview URL)

3. **Verify email:**
   ```bash
   curl "http://localhost:3002/api/auth/verify-email?token=YOUR_TOKEN_HERE"
   ```

4. **Login:**
   ```bash
   curl -X POST http://localhost:3002/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check MONGODB_URI in .env file

2. **Email Not Sending**
   - In development: Check console for Ethereal Email preview URL
   - In production: Verify SMTP credentials

3. **JWT Token Issues**
   - Ensure JWT_SECRET is set
   - Check token expiration

4. **CORS Issues**
   - Verify CORS configuration in app.js
   - Check frontend origin settings

## Security Best Practices

1. **Change default JWT secret** in production
2. **Use environment variables** for sensitive data
3. **Implement rate limiting** for auth endpoints
4. **Add password strength requirements**
5. **Implement account lockout** after failed attempts
6. **Use HTTPS** in production
7. **Regular security audits** of dependencies

## Future Enhancements

- [ ] Password reset functionality
- [ ] Two-factor authentication
- [ ] Social login integration
- [ ] Account deletion
- [ ] Session management
- [ ] Rate limiting
- [ ] Account lockout after failed attempts 