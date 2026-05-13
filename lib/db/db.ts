import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { cache } from 'react';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('⚠️ DATABASE_URL is missing! Database features will not work.');
}

const pooledConnectionString = connectionString ? connectionString.replace(':5432', ':6543') : '';

const client = pooledConnectionString 
  ? postgres(pooledConnectionString, { 
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false, 
    })
  : null;

export const db = client ? drizzle(client, { schema }) : null;

export const getCachedSettings = cache(async () => {
  if (!db) return {};
  try {
    const allSettings = await db.select().from(schema.settings);
    const settingsMap: Record<string, string> = {};
    allSettings.forEach(s => settingsMap[s.key] = s.value || '');
    return settingsMap;
  } catch (err) {
    console.error('[db] getCachedSettings error:', err);
    return {};
  }
});
