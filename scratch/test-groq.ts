import { executeWithAI } from '../lib/pipeline/ai-client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function testGroq() {
  console.log('--- Testing Groq Integration ---');
  console.log('Provider:', process.env.PREFERRED_AI_PROVIDER);
  
  try {
    const result = await executeWithAI({
      systemPrompt: 'You are a sports analyst. Return JSON only.',
      userPrompt: 'Give me a 1-sentence tactical analysis of Real Madrid in 2026.',
      schema: {
        type: 'object',
        properties: {
          analysis: { type: 'string' }
        }
      }
    });
    
    console.log('Groq Success:', result);
  } catch (error) {
    console.error('Groq Test failed:', error);
  }
}

testGroq();
