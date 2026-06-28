import dotenv from 'dotenv';
dotenv.config();

import { redis } from '../config/redis.js';

const startWorkers = async () => {
  try {
    // Import workers (they auto-start on import)
    await import('./videoProcessing.worker.js');

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
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startWorkers();
