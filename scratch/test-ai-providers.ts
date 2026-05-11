import { executeWithAI } from '../lib/pipeline/ai-client';

async function testProviders() {
  console.log('--- Testing AI Providers ---');
  
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
    
    console.log('Success:', result);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testProviders();
