const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  try {
    if (uri) {
      console.log(`Connecting to MongoDB at: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(' MongoDB connected successfully via MONGODB_URI');
      return;
    }

    // Attempt local MongoDB connection first
    try {
      console.log('Attempting connection to local MongoDB (mongodb://127.0.0.1:27017/recipeshare)...');
      await mongoose.connect('mongodb://127.0.0.1:27017/recipeshare', {
        serverSelectionTimeoutMS: 3000,
      });
      console.log(' Local MongoDB connected successfully');
      return;
    } catch (localErr) {
      console.log('Local MongoDB not running. Initializing embedded in-memory MongoDB for zero-config run...');
    }

    // Fallback to MongoMemoryServer
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    const memoryUri = mongodInstance.getUri();
    await mongoose.connect(memoryUri);
    console.log(` Connected to Embedded In-Memory MongoDB (${memoryUri})`);
    console.log(' (Note: In-memory mode active. Data is persisted in-memory during server runtime)');
  } catch (error) {
    console.error(' MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (err) {
    console.error('Error closing DB connection', err);
  }
};

module.exports = { connectDB, disconnectDB };
