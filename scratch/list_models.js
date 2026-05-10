const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
  const keysRaw = process.env.GOOGLE_AI_API_KEYS || process.env.GOOGLE_AI_API_KEY;
  const key = keysRaw.split(',')[0].trim();
  const genAI = new GoogleGenerativeAI(key);

  try {
    // There is no direct listModels on genAI in the latest SDK, it's usually on the model object or a separate client
    // But let's try a few common model strings
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-1.0-pro'];
    for (const m of models) {
      try {
        const model = genAI.getGenerativeModel({ model: m });
        const result = await model.generateContent("Hi");
        console.log(`✅ ${m} works!`);
      } catch (e) {
        console.log(`❌ ${m} failed: ${e.message}`);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

listModels();
