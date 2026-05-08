const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL);

async function test() {
  try {
    const result = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log('Tables in public schema:', result.map(r => r.table_name));
    process.exit(0);
  } catch (err) {
    console.error('Error connecting to DB:', err);
    process.exit(1);
  }
}

test();
