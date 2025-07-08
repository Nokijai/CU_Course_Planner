const mongoose = require('mongoose');
require('dotenv').config();

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

async function cleanupCollections() {
  console.log('🧹 Starting collection cleanup...');
  
  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(mongoConfig.mongoUri, mongoConfig.connectionOptions);
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = mongoose.connection.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📚 Current collections:', collections.map(c => c.name));
    
    // Check if both User and users collections exist
    const userCollection = collections.find(c => c.name === 'User');
    const usersCollection = collections.find(c => c.name === 'users');
    
    if (userCollection && usersCollection) {
      console.log('⚠️  Found both User and users collections');
      
      // Get document counts
      const userCount = await db.collection('User').countDocuments();
      const usersCount = await db.collection('users').countDocuments();
      
      console.log(`📊 User collection: ${userCount} documents`);
      console.log(`📊 users collection: ${usersCount} documents`);
      
      if (userCount > 0 && usersCount === 0) {
        // Move data from User to users
        console.log('🔄 Moving data from User to users collection...');
        const userData = await db.collection('User').find({}).toArray();
        if (userData.length > 0) {
          await db.collection('users').insertMany(userData);
          console.log(`✅ Moved ${userData.length} documents to users collection`);
        }
        await db.collection('User').drop();
        console.log('🗑️  Dropped User collection');
      } else if (usersCount > 0 && userCount === 0) {
        // users collection has data, drop User
        console.log('🗑️  Dropping empty User collection...');
        await db.collection('User').drop();
        console.log('✅ Dropped User collection');
      } else if (userCount > 0 && usersCount > 0) {
        // Both have data - need manual intervention
        console.log('⚠️  Both collections have data. Manual intervention required.');
        console.log('💡 Please check both collections and decide which to keep.');
        return;
      }
    } else if (userCollection && !usersCollection) {
      // Only User collection exists - rename it to users
      console.log('🔄 Renaming User collection to users...');
      await db.collection('User').rename('users');
      console.log('✅ Renamed User collection to users');
    } else if (!userCollection && usersCollection) {
      // Only users collection exists - this is correct
      console.log('✅ Only users collection exists - this is correct');
    } else {
      // No collections exist
      console.log('📝 No user collections exist yet');
    }
    
    // Final check
    const finalCollections = await db.listCollections().toArray();
    console.log('📚 Final collections:', finalCollections.map(c => c.name));
    
    console.log('🎉 Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run cleanup
cleanupCollections(); 