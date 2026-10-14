import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studymate';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Initial connection error: ${error.message}`);
    // If running in development and local mongo isn't up, try memory server fallback
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      try {
        console.log('[MongoDB] Attempting in-memory database fallback for seamless local development...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const memoryUri = mongod.getUri();
        const memoryConn = await mongoose.connect(memoryUri);
        console.log(`[MongoDB] In-memory database started at: ${memoryUri}`);
        return memoryConn;
      } catch (memError) {
        console.error('[MongoDB] In-memory fallback failed:', memError.message);
      }
    }
    throw error;
  }
};
