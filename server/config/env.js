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
};

module.exports = config; 