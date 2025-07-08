const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/env');
const courseRoutes = require('./routes/courseRoutes');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration with support for multiple origins and ngrok
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // If corsOrigin is a string, use it directly
    if (typeof config.corsOrigin === 'string') {
      return callback(null, config.corsOrigin);
    }
    
    // If corsOrigin is an array, check if origin matches any pattern
    if (Array.isArray(config.corsOrigin)) {
      const isAllowed = config.corsOrigin.some(allowedOrigin => {
        // Handle wildcard patterns for ngrok
        if (allowedOrigin.includes('*')) {
          const pattern = allowedOrigin.replace('*', '.*');
          return new RegExp(pattern).test(origin);
        }
        return allowedOrigin === origin;
      });
      
      if (isAllowed) {
        return callback(null, true);
      }
    }
    
    // Default: allow localhost and ngrok domains in development
    if (config.nodeEnv === 'development') {
      if (origin.includes('localhost') || origin.includes('ngrok')) {
        return callback(null, true);
      }
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

app.use(cors(corsOptions));

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'CUHK Course Planner API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// API routes
app.use('/api/courses', courseRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to CUHK Course Planner API',
    version: '1.0.0',
    endpoints: {
      courses: '/api/courses',
      health: '/health'
    }
  });
});

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 CUHK Course Planner API running on port ${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🌐 CORS Origin: ${config.corsOrigin}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app; 