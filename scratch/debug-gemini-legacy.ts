import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function debugGeminiLegacy() {
  const envKeys = process.env.GOOGLE_AI_API_KEYS;
  const keys = envKeys ? envKeys.split(',').map(k => k.trim()) : [];
  
  if (keys.length === 0) return;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    console.log(`Testing Key ${i + 1} with 1.5-Flash (@google/generative-ai)...`);
    
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent('Hello');
      console.log(`✅ Key ${i + 1}: WORKING.`);
    } catch (error: any) {
      console.log(`❌ Key ${i + 1}: FAILED - ${error.message}`);
    }
  }
}

debugGeminiLegacy();
