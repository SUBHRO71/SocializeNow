import { defineConfig } from 'drizzle-kit';
import config from './src/config/index.js';

export default defineConfig({
  schema: './src/db/schema.js',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: config.postgresUri,
  },
  verbose: true,
  strict: false,
});
