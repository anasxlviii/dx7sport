import { runAutonomousGhost } from './lib/pipeline/autonomous';
import { db } from './lib/db/db';

async function test() {
  console.log('Testing Ghost Reporter...');
  try {
    const results = await runAutonomousGhost();
    console.log('Ghost Results:', JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

test();
