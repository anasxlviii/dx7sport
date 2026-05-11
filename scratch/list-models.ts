import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function listModels() {
  const key = process.env.GOOGLE_AI_API_KEYS?.split(',')[0];
  if (!key) return;

  const genAI = new GoogleGenerativeAI(key);
  try {
    // There isn't a direct listModels in the SDK easily without direct fetch or internal
    // but we can try to guess or use a fetch.
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

listModels();
