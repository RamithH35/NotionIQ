import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

let isConnected = false;
let memoryServerInstance = null;

export async function connectDB() {
  if (isConnected) return mongoose.connection;

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/notioniq';

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    isConnected = true;
    console.log('[DB] Connected to MongoDB at', mongoUri);
    return mongoose.connection;
  } catch (err) {
    console.warn('[DB] Primary MongoDB connection failed (' + err.message + '). Starting in-memory MongoDB fallback...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServerInstance = await MongoMemoryServer.create();
      const uri = memoryServerInstance.getUri();
      await mongoose.connect(uri);
      isConnected = true;
      console.log('[DB] Connected to in-memory MongoDB at', uri);
      return mongoose.connection;
    } catch (memErr) {
      console.error('[DB] Failed to start MongoDB fallback:', memErr);
      throw memErr;
    }
  }
}
