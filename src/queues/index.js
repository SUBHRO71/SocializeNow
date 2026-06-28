import { Queue } from 'bullmq';
import { redisConfig } from '../config/redis.js';

const connection = {
  host: redisConfig.host,
  port: redisConfig.port,
  password: redisConfig.password,
};

// Video processing queue - handles metadata extraction, thumbnail generation, etc.
const videoProcessingQueue = new Queue('video-processing', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

console.log('📋 Job queues initialized');

export { videoProcessingQueue };
