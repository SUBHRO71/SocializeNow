import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/).trim(),
  email: z.string().email().trim(),
  fullName: z.string().min(2).max(50).trim(),
  password: z.string().min(8).max(100)
});

export const loginSchema = z.object({
  username: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(1, 'Password is required')
}).refine(data => data.username || data.email, {
  message: "Either username or email is required",
  path: ["username"]
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z.string().min(8).max(100)
});

export const updateAccountSchema = z.object({
  fullName: z.string().min(2).max(50).trim().optional(),
  email: z.string().email().trim().optional()
});
