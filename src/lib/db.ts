import mongoose from 'mongoose';
import { env, useDemoData } from './env';

const DATABASE_NAME = 'cinerusubs' as const;

type Cache = { connection: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const globalWithMongoose = globalThis as typeof globalThis & { __cineruMongoose?: Cache };
const cache = globalWithMongoose.__cineruMongoose ?? { connection: null, promise: null };
globalWithMongoose.__cineruMongoose = cache;

export async function connectDb() {
  if (useDemoData) throw new Error('MongoDB is unavailable while CineruSubs demo mode is active');
  if (env.MONGODB_DB !== DATABASE_NAME) throw new Error('CineruSubs must use the isolated cinerusubs database');
  if (cache.connection) return cache.connection;
  cache.promise ??= mongoose.connect(env.MONGODB_URI!, {
    dbName: DATABASE_NAME,
    autoIndex: env.NODE_ENV !== 'production',
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 8_000,
  });
  cache.connection = await cache.promise;
  return cache.connection;
}

export async function disconnectDb() {
  if (cache.connection) await mongoose.disconnect();
  cache.connection = null;
  cache.promise = null;
}

export { DATABASE_NAME };
