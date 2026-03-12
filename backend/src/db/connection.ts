/**
 * db/connection.ts
 *
 * Mongoose connection with auto-reconnect and graceful shutdown.
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neuralbase';

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI, {
      // Keep alive so the connection isn't dropped by idle timeout
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`[MongoDB] Connected → ${MONGODB_URI.replace(/:\/\/.*@/, '://***@')}`);
  } catch (err) {
    console.error('[MongoDB] Connection failed:', err);
    throw err;
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected — Mongoose will auto-reconnect');
  });
  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] Error:', err);
  });
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  console.log('[MongoDB] Disconnected gracefully');
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await disconnectDB();
  process.exit(0);
});
