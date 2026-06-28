import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import config from '../config/index.js';
import * as schema from './schema.js';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: config.postgresUri,
});

export const db = drizzle(pool, { schema });

const connectDB = async () => {
    try {
        await pool.connect();
        console.log(`\n PostgreSQL connected !!`);
    } catch (error) {
        console.log("PostgreSQL connection FAILED ", error);
        process.exit(1)
    }
}

export default connectDB;