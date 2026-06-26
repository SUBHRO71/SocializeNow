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

// Notification queue - handles sending notifications for social events
const notificationQueue = new Queue('notifications', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 100 },
  },
});

console.log('📋 Job queues initialized');

export { videoProcessingQueue, notificationQueue };
