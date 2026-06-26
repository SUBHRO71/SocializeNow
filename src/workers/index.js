import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { redis } from '../config/redis.js';

const DB_NAME = 'videotube';

const startWorkers = async () => {
  try {
    // Connect to MongoDB
    const conn = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log(`\n💾 Workers MongoDB connected: ${conn.connection.host}`);

    // Import workers (they auto-start on import)
    await import('./videoProcessing.worker.js');
    await import('./notification.worker.js');

    console.log('🚀 All workers started and listening for jobs');
  } catch (err) {
    console.error('❌ Worker startup failed:', err);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  console.log('\n🛑 Shutting down workers...');
  await redis.quit();
  await mongoose.disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startWorkers();
