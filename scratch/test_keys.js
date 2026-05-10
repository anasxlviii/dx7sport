const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testKeys() {
  const keysRaw = process.env.GOOGLE_AI_API_KEYS || process.env.GOOGLE_AI_API_KEY;
  if (!keysRaw) {
    console.error('No keys found in .env');
    return;
  }
  const keys = keysRaw.split(',').map(k => k.trim());
  console.log(`Found ${keys.length} keys.`);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    console.log(`Testing Key ${i + 1} (${key.substring(0, 5)}...):`);
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent("Say hello!");
      console.log(`  ✅ Success: ${result.response.text()}`);
    } catch (err) {
      console.error(`  ❌ Failed: ${err.message}`);
    }
  }
}

testKeys();
