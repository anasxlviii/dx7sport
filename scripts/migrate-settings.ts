import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const client = postgres(connectionString, { max: 1 });

async function migrate() {
  console.log('Creating settings table if not exists...');
  await client`
    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      key VARCHAR(100) NOT NULL UNIQUE,
      value TEXT,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  console.log('✅ Done');
  await client.end();
}

migrate().catch(err => { console.error(err); process.exit(1); });
