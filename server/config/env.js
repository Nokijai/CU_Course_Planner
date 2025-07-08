require('dotenv').config();

const config = {
  port: process.env.PORT || 3002,
  nodeEnv: process.env.NODE_ENV || 'development',
  // External data source URL (this would be the CUHK course data API)
  externalDataUrl: process.env.EXTERNAL_DATA_URL || 'https://api.cuhk.edu.hk/courses',
  // Local data path for development
  localDataPath: process.env.LOCAL_DATA_PATH || '../Data',
  // CORS settings - allow multiple origins for development
  corsOrigin: process.env.CORS_ORIGIN || [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://*.ngrok-free.app',
    'https://*.ngrok.io'
  ],
  // Cache settings
  cacheDuration: process.env.CACHE_DURATION || 3600, // 1 hour in seconds
  // MongoDB settings
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cuhk-course-planner',
  // JWT settings
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  // Email settings
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: process.env.SMTP_PORT || 587,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpFrom: process.env.SMTP_FROM || '"CUHK Course Planner" <noreply@cuhk-course-planner.com>',
};

module.exports = config; 