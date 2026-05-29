import { GoogleGenAI } from '@google/genai'

function getGeminiKeys() {
  const keys = [];
  const envKeys = process.env.GOOGLE_AI_API_KEYS;
  if (envKeys) {
    keys.push(...envKeys.split(',').map((k) => k.trim()).filter(Boolean));
  }
  const singleKey = process.env.GOOGLE_AI_API_KEY;
  if (singleKey) {
    const trimmed = singleKey.trim();
    if (!keys.includes(trimmed)) {
      keys.push(trimmed);
    }
  }
  return keys;
}

const geminiKeys = getGeminiKeys();
const keyCooldowns = {};
const COOLDOWN_MS = 60_000;

function getAvailableGeminiKeyIndex(startIndex) {
  const now = Date.now();
  for (let i = 0; i < geminiKeys.length; i++) {
    const idx = (startIndex + i) % geminiKeys.length;
    const cooldownUntil = keyCooldowns[geminiKeys[idx]] ?? 0;
    if (now >= cooldownUntil) return idx;
  }
  let earliestIdx = startIndex;
  let earliestExpiry = Infinity;
  for (let i = 0; i < geminiKeys.length; i++) {
    const idx = (startIndex + i) % geminiKeys.length;
    const expiry = keyCooldowns[geminiKeys[idx]] ?? 0;
    if (expiry < earliestExpiry) {
      earliestExpiry = expiry;
      earliestIdx = idx;
    }
  }
  return earliestIdx;
}

async function generateContentGemini(options) {
  if (geminiKeys.length === 0) {
    throw new Error('[AI Client] No Gemini keys configured in environment.');
  }

  let currentKeyIndex = getAvailableGeminiKeyIndex(0);
  let attempts = 0;
  const maxAttempts = geminiKeys.length + 2;

  while (attempts < maxAttempts) {
    const key = geminiKeys[currentKeyIndex];
    const client = new GoogleGenAI({ apiKey: key });

    try {
      console.log(`[AI Client] Using key rotation index ${currentKeyIndex} (...${key.slice(-4)})`);

      const result = await client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: `${options.systemPrompt}\n\n${options.userPrompt}` }] }],
        config: {
          responseMimeType: options.schema ? 'application/json' : 'text/plain',
          responseSchema: options.schema,
          temperature: options.temperature ?? 0.5,
          maxOutputTokens: 4000,
        },
      });

      delete keyCooldowns[key];
      const text = result.text || '{}';
      return options.schema ? JSON.parse(text) : text;
    } catch (error) {
      const status = error?.status ?? error?.httpStatus;
      if (status === 429 || status === 503) {
        console.warn(`[AI Client] Rate limited (...${key.slice(-4)}), rotating key...`);
        keyCooldowns[key] = Date.now() + COOLDOWN_MS;
        attempts++;
        currentKeyIndex = getAvailableGeminiKeyIndex((currentKeyIndex + 1) % geminiKeys.length);
        continue;
      }
      throw error;
    }
  }

  throw new Error('[AI Client] All Gemini keys exhausted or rate-limited.');
}

async function generateContentGroq(options) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('[Groq Client] No Groq key configured in environment.');
  }

  const models = ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'llama3-70b-8192'];
  for (const model of models) {
    try {
      console.log(`[Groq Client] Trying model: ${model}...`);
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: options.systemPrompt },
            { role: 'user', content: options.userPrompt }
          ],
          response_format: options.schema ? { type: 'json_object' } : undefined,
          temperature: options.temperature ?? 0.6
        })
      });

      if (res.status === 429 || res.status === 503) {
        console.warn(`[Groq Client] Model ${model} rate-limited, rotating model...`);
        continue;
      }

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[Groq Client] Model ${model} failed with status ${res.status}: ${errText}`);
        continue;
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '{}';
      console.log(`[Groq Client] Raw generated text for model ${model}:`, text);

      if (options.schema) {
        return JSON.parse(text);
      }
      return text;
    } catch (err) {
      console.warn(`[Groq Client] Exception on model ${model}:`, err.message);
    }
  }
  throw new Error('[Groq Client] All Groq models rate-limited or failed.');
}

export async function generateContentAI(options) {
  try {
    return await generateContentGemini(options);
  } catch (geminiErr) {
    console.warn('[AI Pipeline] Gemini failed or rate-limited. Falling back to Groq...', geminiErr.message);
    try {
      return await generateContentGroq(options);
    } catch (groqErr) {
      console.error('[AI Pipeline] Both Gemini and Groq failed.', groqErr.message);
      throw new Error(`AI services unavailable: ${groqErr.message}`);
    }
  }
}
