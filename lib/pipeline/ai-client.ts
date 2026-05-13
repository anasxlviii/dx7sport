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
 * Unified execution wrapper for AI operations.
 * Priority: Gemini (key rotation across 5 keys) -> Ollama/Gemma 4 (local fallback)
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
    const maxAttempts = geminiKeys.length * 3;

    while (attempts < maxAttempts) {
      const key = geminiKeys[currentKeyIndex];
      const client = new GoogleGenAI({ apiKey: key });

      try {
        console.log(`[AI Client] Using Gemini (Key ...${key.slice(-4)})`);

        await new Promise(resolve => setTimeout(resolve, 2000));

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

  // 2. Fallback: Local Ollama (gemma2:2b — lightweight, loads instantly)
  try {
    const ollamaRes = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemma2:2b',
        messages: [
          { role: 'system', content: options.schema
            ? `${options.systemPrompt}\n\nIMPORTANT: You must return a JSON object that strictly follows this schema:\n${JSON.stringify(options.schema, null, 2)}`
            : options.systemPrompt },
          { role: 'user', content: options.userPrompt },
        ],
        stream: false,
        format: options.schema ? 'json' : undefined,
        options: { temperature: options.temperature ?? 0.4, num_predict: 4096 },
      }),
      signal: AbortSignal.timeout(60000),
    });
    if (ollamaRes.ok) {
      const data = await ollamaRes.json();
      const content = data?.message?.content || data?.response || '{}';
      console.log('[AI Client] Using local Ollama (gemma2:2b)');
      return (options.schema ? JSON.parse(content) : content) as T;
    }
  } catch (err: any) {
    console.warn('[AI Client] Ollama/gemma2:2b fallback failed:', err.message);
  }

  throw new Error('[AI Client] All AI providers exhausted or failed.');
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
