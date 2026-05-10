const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
  const keysRaw = process.env.GOOGLE_AI_API_KEYS || process.env.GOOGLE_AI_API_KEY;
  const key = keysRaw.split(',')[0].trim();
  
  try {
    // The SDK might not have a direct listModels, so let's try a raw fetch to the API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${key}`);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

listModels();
