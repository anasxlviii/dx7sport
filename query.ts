import { db } from './lib/db/db';
import { articles } from './lib/db/schema';
import { desc } from 'drizzle-orm';

async function main() {
  const result = await db.select().from(articles).orderBy(desc(articles.id)).limit(5);
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}
main();
