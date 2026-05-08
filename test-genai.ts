import { GoogleGenAI } from '@google/genai';

async function run() {
  const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
  const result = await client.models.generateContent({
    model: 'gemini-3.1-pro',
    contents: 'Say hi'
  });
  console.log(typeof result.text, result.text);
}

run().catch(console.error);
