import { z } from 'zod';

export const publishVideoSchema = z.object({
  title: z.string().min(3).max(200).trim(),
  description: z.string().max(5000).trim().optional().default("")
});

export const updateVideoSchema = z.object({
  title: z.string().min(3).max(200).trim().optional(),
  description: z.string().max(5000).trim().optional()
});

export const getAllVideosQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  query: z.string().optional(),
  sortBy: z.string().optional(),
  sortType: z.enum(['asc', 'desc']).optional(),
  userId: z.string().optional()
});
