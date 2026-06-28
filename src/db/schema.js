import { pgTable, uuid, text, varchar, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  avatar: text('avatar'), // cloudinary url
  coverImage: text('cover_image'), // cloudinary url
  password: text('password').notNull(),
  refreshToken: text('refresh_token'),
  portfolioSlug: varchar('portfolio_slug', { length: 255 }).unique(),
  portfolioVisibility: varchar('portfolio_visibility', { length: 50 }).default('public'), // 'public' | 'private'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const videos = pgTable('videos', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  thumbnail: text('thumbnail'), // cloudinary url
  rawVideoUrl: text('raw_video_url').notNull(), // cloudinary url
  hlsManifestUrl: text('hls_manifest_url'),
  isTranscoded: boolean('is_transcoded').default(false),
  resolutionsAvailable: jsonb('resolutions_available').default('[]'),
  keyframes: jsonb('keyframes').default('[]'),
  duration: integer('duration').default(0),
  sharePassword: text('share_password'), // hashed
  shareExpiryDate: timestamp('share_expiry_date'),
  visibility: varchar('visibility', { length: 20 }).default('public'), // 'public' | 'private' | 'unlisted'
  views: integer('views').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const designs = pgTable('designs', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  images: jsonb('images').default('[]').notNull(), // array of cloudinary urls
  toolsUsed: jsonb('tools_used').default('[]'),
  sharePassword: text('share_password'), // hashed
  shareExpiryDate: timestamp('share_expiry_date'),
  visibility: varchar('visibility', { length: 20 }).default('public'), // 'public' | 'private' | 'unlisted'
  views: integer('views').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
