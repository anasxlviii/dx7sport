import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';
import OpenAI from 'openai';

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

// --- Provider Clients ---
let groqInstance: Groq | null = null;
function getGroq() {
  if (!groqInstance && process.env.GROQ_API_KEY) {
    groqInstance = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqInstance;
}

let openRouterInstance: OpenAI | null = null;
function getOpenRouter() {
  if (!openRouterInstance && process.env.OPENROUTER_API_KEY) {
    openRouterInstance = new OpenAI({ 
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://dx7sport.com',
        'X-Title': 'DX7 Sport',
      }
    });
  }
  return openRouterInstance;
}

/**
 * Unified execution wrapper for AI operations.
 * Priority: Groq -> OpenRouter -> Gemini (Rotation)
 */
export async function executeWithAI<T>(
  options: {
    systemPrompt: string;
    userPrompt: string;
    schema?: any;
    temperature?: number;
    provider?: 'gemini' | 'groq' | 'openrouter';
  }
): Promise<T> {
  const preferredProvider = options.provider || process.env.PREFERRED_AI_PROVIDER || 'groq';
  const groq = getGroq();
  const openRouter = getOpenRouter();

  // 1. Try Groq (Fastest, High Rate Limits)
  if ((preferredProvider === 'groq' || !geminiKeys.length) && groq) {
    try {
      console.log('[AI Client] Using Groq (Llama 3.1 70B)');
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: options.systemPrompt },
          { role: 'user', content: options.userPrompt }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: options.temperature ?? 0.4,
        response_format: options.schema ? { type: 'json_object' } : undefined,
      });
      const content = completion.choices[0]?.message?.content || '{}';
      return JSON.parse(content) as T;
    } catch (error: any) {
      console.warn('[AI Client] Groq failed, falling back...', error.message);
    }
  }

  // 2. Try OpenRouter (Near-Unlimited, Paid Fallback)
  if (openRouter && (preferredProvider === 'openrouter' || preferredProvider === 'groq')) {
    try {
      console.log('[AI Client] Using OpenRouter (Gemini 2.0 Flash / Pro)');
      const completion = await openRouter.chat.completions.create({
        messages: [
          { role: 'system', content: options.systemPrompt },
          { role: 'user', content: options.userPrompt }
        ],
        model: 'google/gemini-2.0-flash-001', // Or 'meta-llama/llama-3.1-405b-instruct'
        temperature: options.temperature ?? 0.4,
        response_format: options.schema ? { type: 'json_object' } : undefined,
      });
      const content = completion.choices[0]?.message?.content || '{}';
      return JSON.parse(content) as T;
    } catch (error: any) {
      console.warn('[AI Client] OpenRouter failed, falling back...', error.message);
    }
  }

  // 3. Fallback to Gemini Rotation (Free Tier)
  if (geminiKeys.length > 0) {
    let currentKeyIndex = getAvailableGeminiKeyIndex(0);
    let attempts = 0;
    const maxAttempts = geminiKeys.length * 2;

    while (attempts < maxAttempts) {
      const key = geminiKeys[currentKeyIndex];
      const client = new GoogleGenAI({ apiKey: key });

      try {
        console.log(`[AI Client] Using Gemini Free Tier (Key ...${key.slice(-4)})`);
        const result = await client.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [{ role: 'user', parts: [{ text: `${options.systemPrompt}\n\n${options.userPrompt}` }] }],
          config: {
            responseMimeType: options.schema ? 'application/json' : 'text/plain',
            responseSchema: options.schema,
            temperature: options.temperature ?? 0.4,
          },
        });
        delete keyCooldowns[key];
        const text = result.text || '{}';
        return (options.schema ? JSON.parse(text) : text) as T;
      } catch (error: any) {
        const status = error?.status ?? error?.httpStatus;
        if (status === 429 || status === 503) {
          keyCooldowns[key] = Date.now() + COOLDOWN_MS;
          attempts++;
          currentKeyIndex = getAvailableGeminiKeyIndex((currentKeyIndex + 1) % geminiKeys.length);
          continue;
        }
        throw error;
      }
    }
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
