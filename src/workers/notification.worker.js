import { Worker } from 'bullmq';
import { redisConfig } from '../config/redis.js';
import { Notification } from '../models/notification.model.js';

const connection = {
  host: redisConfig.host,
  port: redisConfig.port,
  password: redisConfig.password,
};

const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    const { type, recipientId, senderId, message, referenceModel, referenceId } = job.data;
    console.log(`🔔 Processing notification: ${type} for user ${recipientId}`);

    // Don't notify yourself
    if (recipientId.toString() === senderId.toString()) {
      return { skipped: true, reason: 'self-notification' };
    }

    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      message,
      referenceModel,
      referenceId,
    });

    console.log(`✅ Notification created: ${notification._id}`);
    return { notificationId: notification._id };
  },
  {
    connection,
    concurrency: 10,
  }
);

notificationWorker.on('completed', (job) => {
  console.log(`🔔 Notification job ${job.id} completed`);
});

notificationWorker.on('failed', (job, err) => {
  console.error(`🔔 Notification job ${job?.id} failed:`, err.message);
});

export default notificationWorker;
