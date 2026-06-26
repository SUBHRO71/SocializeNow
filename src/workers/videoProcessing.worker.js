import { Worker } from 'bullmq';
import { redisConfig } from '../config/redis.js';
import mongoose from 'mongoose';
import { Video } from '../models/video.model.js';
import ffmpeg from 'fluent-ffmpeg';

const connection = {
  host: redisConfig.host,
  port: redisConfig.port,
  password: redisConfig.password,
};

/**
 * Extract video metadata using ffprobe
 * @param {string} videoUrl - URL of the video file
 * @returns {Promise<object>} - Video metadata
 */
const extractVideoMetadata = (videoUrl) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoUrl, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

      resolve({
        duration: Math.round(metadata.format.duration || 0),
        size: metadata.format.size,
        bitrate: metadata.format.bit_rate,
        format: metadata.format.format_name,
        video: videoStream ? {
          codec: videoStream.codec_name,
          width: videoStream.width,
          height: videoStream.height,
          fps: eval(videoStream.r_frame_rate) || 0,
          aspectRatio: videoStream.display_aspect_ratio,
        } : null,
        audio: audioStream ? {
          codec: audioStream.codec_name,
          sampleRate: audioStream.sample_rate,
          channels: audioStream.channels,
        } : null,
      });
    });
  });
};

const videoWorker = new Worker(
  'video-processing',
  async (job) => {
    const { videoId } = job.data;
    console.log(`🎬 Processing video: ${videoId}`);

    try {
      const video = await Video.findById(videoId);
      if (!video) {
        throw new Error(`Video not found: ${videoId}`);
      }

      // Update status to processing
      video.processingStatus = 'processing';
      await video.save();

      // Extract metadata from the Cloudinary URL
      const videoUrl = video.videoFile.url;
      job.updateProgress(20);

      try {
        const metadata = await extractVideoMetadata(videoUrl);
        job.updateProgress(60);

        // Update video with extracted metadata
        video.duration = metadata.duration;
        video.metadata = {
          size: metadata.size,
          format: metadata.format,
          bitrate: metadata.bitrate,
          resolution: metadata.video ? `${metadata.video.width}x${metadata.video.height}` : null,
          codec: metadata.video?.codec,
          fps: metadata.video?.fps,
          audioCodec: metadata.audio?.codec,
        };
        video.processingStatus = 'completed';
        await video.save();

        job.updateProgress(100);
        console.log(`✅ Video processed: ${videoId} (${metadata.duration}s, ${metadata.video?.width}x${metadata.video?.height})`);

        return { videoId, metadata };
      } catch (ffprobeErr) {
        console.warn(`⚠️ FFprobe failed for ${videoId}: ${ffprobeErr.message}. Marking as completed without metadata.`);
        video.processingStatus = 'completed';
        await video.save();
        return { videoId, metadata: null, warning: 'FFprobe extraction failed' };
      }
    } catch (err) {
      console.error(`❌ Video processing failed: ${videoId}`, err.message);
      await Video.findByIdAndUpdate(videoId, { processingStatus: 'failed' });
      throw err;
    }
  },
  {
    connection,
    concurrency: 2,
    limiter: {
      max: 5,
      duration: 60000, // Max 5 jobs per minute
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
