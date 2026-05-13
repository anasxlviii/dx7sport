import { GoogleGenAI } from '@google/genai';

// --- Gemini Configuration ---
function getGeminiKeys(): string[] {
  const envKeys = process.env.GOOGLE_AI_API_KEYS;
  if (envKeys) {
    return envKeys.split(',').map((k) => k.trim()).filter(Boolean);
  }
  const singleKey = process.env.GOOGLE_AI_API_KEY;
  return singleKey ? [singleKey.trim()] : [];
}

const geminiKeys = getGeminiKeys();
const keyCooldowns: Record<string, number> = {};
const COOLDOWN_MS = 60_000;

function getAvailableGeminiKeyIndex(startIndex: number): number {
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

/**
 * Unified execution wrapper for AI operations using Gemini with 5-key rotation.
 */
export async function executeWithAI<T>(
  options: {
    systemPrompt: string;
    userPrompt: string;
    schema?: any;
    temperature?: number;
    provider?: 'gemini';
  }
): Promise<T> {
  // 1. Try Gemini with key rotation (5 keys in rotation for quota management)
  if (geminiKeys.length > 0) {
    let currentKeyIndex = getAvailableGeminiKeyIndex(0);
    let attempts = 0;
    const maxAttempts = geminiKeys.length + 2; // try each key once + 2 extra as buffer

    while (attempts < maxAttempts) {
      const key = geminiKeys[currentKeyIndex];
      const client = new GoogleGenAI({ apiKey: key });

      try {
        console.log(`[AI Client] Using Gemini (Key ...${key.slice(-4)})`);

        const result = await client.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [{ role: 'user', parts: [{ text: `${options.systemPrompt}\n\n${options.userPrompt}` }] }],
          config: {
            responseMimeType: options.schema ? 'application/json' : 'text/plain',
            responseSchema: options.schema,
            temperature: options.temperature ?? 0.4,
            maxOutputTokens: 8192,
            safetySettings: [
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            ] as any,
          },
        });
        delete keyCooldowns[key];
        const text = result.text || '{}';
        return (options.schema ? JSON.parse(text) : text) as T;
      } catch (error: any) {
        const status = error?.status ?? error?.httpStatus;
        if (status === 429 || status === 503) {
          console.warn(`[AI Client] Gemini key ...${key.slice(-4)} rate-limited, rotating...`);
          keyCooldowns[key] = Date.now() + COOLDOWN_MS;
          attempts++;
          currentKeyIndex = getAvailableGeminiKeyIndex((currentKeyIndex + 1) % geminiKeys.length);
          continue;
        }
        throw error;
      }
    }
  }

  throw new Error('[AI Client] All Gemini keys exhausted (rate-limited).');
}

// Legacy support for manual Gemini operations if needed
export async function executeWithGemini<T>(
  operation: (client: GoogleGenAI) => Promise<T>
): Promise<T> {
  let currentKeyIndex = getAvailableGeminiKeyIndex(0);
  const key = geminiKeys[currentKeyIndex];
  const client = new GoogleGenAI({ apiKey: key });
  return operation(client);
}
