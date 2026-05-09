import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Optimized Supabase Connection for Vercel.
 * Using the Supabase Transaction Pooler (port 6543) for high-traffic stability.
 */

const connectionString = process.env.DATABASE_URL!;

// Ensure we are using the transaction pooler port (6543) for serverless environments
// This prevents "Connection Limit" errors under high traffic.
const pooledConnectionString = connectionString.replace(':5432', ':6543');

const client = postgres(pooledConnectionString, { 
  max: 10, // Increased for high traffic
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false, // Mandatory for Supabase transaction mode pooler
});

export const db = drizzle(client, { schema });
