import mongoose from 'mongoose';
import { config } from './config.js';

export async function connectDb() {
  await mongoose.connect(config.MONGODB_URI, { dbName: 'clothing_store', autoIndex: config.NODE_ENV !== 'production' });
}

export async function disconnectDb() { await mongoose.disconnect(); }
