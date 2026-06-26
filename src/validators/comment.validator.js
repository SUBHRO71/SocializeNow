import { z } from 'zod';

export const addCommentSchema = z.object({
  content: z.string().min(1).max(2000).trim(),
  parentComment: z.string().optional()
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(2000).trim()
});
