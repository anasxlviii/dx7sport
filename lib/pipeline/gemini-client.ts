import { GoogleGenerativeAI } from '@google/generative-ai';


function getKeys(): string[] {
  // Support either a comma-separated list of keys, or the old single key
  const envKeys = process.env.GOOGLE_AI_API_KEYS;
  if (envKeys) {
    return envKeys.split(',').map(k => k.trim()).filter(Boolean);
  }
  const singleKey = process.env.GOOGLE_AI_API_KEY;
  return singleKey ? [singleKey.trim()] : [];
}

const keys = getKeys();
let currentKeyIndex = 0;

/**
 * Executes a Gemini API operation, automatically switching to the next
 * available API key if a 429 (Quota Exceeded) error occurs.
 */
export async function executeWithGemini<T>(
  operation: (client: GoogleGenAI) => Promise<T>
): Promise<T> {
  if (keys.length === 0) {
    throw new Error('No Google AI API keys configured. Please set GOOGLE_AI_API_KEYS or GOOGLE_AI_API_KEY in .env');
  }

  let attempts = 0;
  while (attempts < keys.length) {
    const key = keys[currentKeyIndex];
    const client = new GoogleGenerativeAI(key);

    try {
      return await operation(client);
    } catch (error: any) {
      // Check if it's a quota error
      const isQuotaError = 
        error?.status === 429 || 
        error?.message?.includes('429') ||
        error?.message?.includes('RESOURCE_EXHAUSTED');

      if (isQuotaError) {
        console.warn(`[Gemini API] Key ending in ...${key.slice(-4)} exhausted its quota. Switching keys...`);
        currentKeyIndex = (currentKeyIndex + 1) % keys.length;
        attempts++;
      } else {
        // If it's a different error (e.g. 400 Bad Request, 500 Internal Server Error), throw immediately
        throw error;
      }
    }
  }

  throw new Error('All available Google AI API keys have hit their quota limits (429). Please add more keys or wait.');
}
