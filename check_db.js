import dotenv from 'dotenv';
dotenv.config();

import { db } from './src/db/db.js';
import { sql } from 'drizzle-orm';

async function check() {
  const result = await db.execute(sql`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_name IN ('videos', 'designs', 'users')
    ORDER BY table_name, ordinal_position;
  `);
  
  const tables = {};
  result.rows.forEach(row => {
    if (!tables[row.table_name]) tables[row.table_name] = [];
    tables[row.table_name].push(row.column_name);
  });
  
  console.log(JSON.stringify(tables, null, 2));
  process.exit(0);
}

check().catch(e => {
  console.error(e);
  process.exit(1);
});
