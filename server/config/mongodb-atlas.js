// MongoDB Atlas Configuration
// This file contains the configuration for connecting to MongoDB Atlas

const config = {
  // MongoDB Atlas Connection String
  // Format: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cuhk-course-planner',
  
  // Connection Options for MongoDB Atlas
  connectionOptions: {
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    bufferCommands: false, // Disable mongoose buffering
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverApi: {
      version: '1',
      strict: false,
      deprecationErrors: false,
    },
    // Additional options for Atlas
    retryWrites: true,
    w: 'majority',
  },
  
  // Database name
  databaseName: 'CU_Course_Planner',
  
  // Collections
  collections: {
    users: 'users',
    courses: 'courses',
    schedules: 'schedules',
    favorites: 'favorites',
    searchHistory: 'search_history'
  }
};

module.exports = config; 