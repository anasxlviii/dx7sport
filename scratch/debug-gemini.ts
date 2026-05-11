import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function debugGeminiKeys() {
  const envKeys = process.env.GOOGLE_AI_API_KEYS;
  const keys = envKeys ? envKeys.split(',').map(k => k.trim()) : [];
  
  if (keys.length === 0) {
    console.error('No keys found in GOOGLE_AI_API_KEYS');
    return;
  }

  console.log(`Found ${keys.length} keys to test...\n`);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    console.log(`Testing Key ${i + 1} (Suffix: ...${key.slice(-4)})...`);
    
    try {
      const client = new GoogleGenAI({ apiKey: key });
      const result = await client.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: 'Hello, respond with "OK"' }] }],
        config: { temperature: 0.1 }
      });
      
      console.log(`✅ Key ${i + 1}: WORKING. Output: "${result.text}"`);
    } catch (error: any) {
      console.log(`❌ Key ${i + 1}: FAILED`);
      console.log(`   Error Code: ${error.status || error.httpStatus || 'Unknown'}`);
      console.log(`   Message: ${error.message}`);
      
      if (error.message?.includes('API_KEY_INVALID')) {
        console.log('   Reason: The key is invalid or deleted.');
      } else if (error.status === 429) {
        console.log('   Reason: Rate limited (Quota exhausted).');
      } else if (error.message?.includes('Safety')) {
        console.log('   Reason: Blocked by safety filters.');
      } else if (error.status === 403) {
        console.log('   Reason: Permission denied (Check project restrictions).');
      }
    }
    console.log('-----------------------------------');
  }
}

debugGeminiKeys();
