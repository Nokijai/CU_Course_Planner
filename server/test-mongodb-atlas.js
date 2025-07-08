const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB Atlas configuration
const mongoConfig = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cuhk-course-planner',
  connectionOptions: {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferCommands: false,
    maxPoolSize: 10,
    serverApi: {
      version: '1',
      strict: false,
      deprecationErrors: false,
    },
    retryWrites: true,
    w: 'majority',
  }
};

async function testMongoDBAtlasConnection() {
  console.log('🔍 Testing MongoDB Atlas Connection...');
  console.log('📊 Connection String:', mongoConfig.mongoUri.replace(/\/\/.*@/, '//***:***@'));
  console.log('⚙️  Environment:', process.env.NODE_ENV || 'development');
  console.log('');

  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(mongoConfig.mongoUri, mongoConfig.connectionOptions);
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    console.log('🌐 Host:', mongoose.connection.host);
    console.log('🔌 Port:', mongoose.connection.port);
    console.log('👤 User:', mongoose.connection.user);
    
    // Test basic operations
    console.log('\n🧪 Testing basic operations...');
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📚 Collections found:', collections.length);
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Test a simple query
    const stats = await mongoose.connection.db.stats();
    console.log('📈 Database stats:');
    console.log(`   - Collections: ${stats.collections}`);
    console.log(`   - Data size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - Storage size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('\n🎉 All tests passed! MongoDB Atlas is working correctly.');
    
  } catch (error) {
    console.error('❌ MongoDB Atlas connection failed:');
    console.error('   Error:', error.message);
    console.error('');
    console.error('🔧 Troubleshooting tips:');
    console.error('   1. Check your MONGODB_URI environment variable');
    console.error('   2. Verify username and password are correct');
    console.error('   3. Ensure your IP is whitelisted in Atlas');
    console.error('   4. Check if the cluster is running');
    console.error('   5. Verify network connectivity');
    console.error('');
    console.error('📝 Expected format:');
    console.error('   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority');
    
    process.exit(1);
  } finally {
    // Close connection
    await mongoose.disconnect();
    console.log('\n🔌 Connection closed.');
  }
}

// Run the test
testMongoDBAtlasConnection(); 