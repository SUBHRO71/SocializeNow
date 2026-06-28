import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function checkSchema() {
  await client.connect();
  const res = await client.query(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name IN ('videos', 'designs', 'users')
    ORDER BY table_name, ordinal_position;
  `);
  
  const tables = {};
  res.rows.forEach(row => {
    if (!tables[row.table_name]) tables[row.table_name] = [];
    tables[row.table_name].push(row.column_name);
  });
  
  console.log(JSON.stringify(tables, null, 2));
  await client.end();
}

checkSchema().catch(console.error);
