import { Worker } from 'bullmq';
import { redisConfig } from '../config/redis.js';
import { db } from "../db/db.js";
import { videos } from "../db/schema.js";
import { eq } from "drizzle-orm";

const connection = {
  host: redisConfig.host,
  port: redisConfig.port,
  password: redisConfig.password,
};

const videoWorker = new Worker(
  'video-processing',
  async (job) => {
    const { videoId } = job.data;
    console.log(`🎬 Processing video placeholder: ${videoId}`);
    
    // In Phase 2 this will integrate FFmpeg
    // For now we just mock completion
    const existingVideo = await db.select().from(videos).where(eq(videos.id, videoId));
    
    if (!existingVideo.length) {
      throw new Error(`Video not found: ${videoId}`);
    }

    return { videoId, status: "placeholder" };
  },
  {
    connection,
    concurrency: 2,
    limiter: {
      max: 5,
      duration: 60000, 
    },
  }
);

videoWorker.on('completed', (job) => {
  console.log(`📹 Video job ${job.id} completed`);
});

videoWorker.on('failed', (job, err) => {
  console.error(`📹 Video job ${job?.id} failed:`, err.message);
});

export default videoWorker;
