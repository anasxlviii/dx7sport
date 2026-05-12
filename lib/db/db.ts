import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Optimized Supabase Connection for Vercel.
 * Using the Supabase Transaction Pooler (port 6543) for high-traffic stability.
 */

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('⚠️ DATABASE_URL is missing! Database features will not work.');
}

const pooledConnectionString = connectionString ? connectionString.replace(':5432', ':6543') : '';

// Create client ONLY if we have a connection string
const client = pooledConnectionString 
  ? postgres(pooledConnectionString, { 
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false, 
    })
  : null;

// Create drizzle instance only if client is valid
export const db = client ? drizzle(client, { schema }) : null;

