import { GoogleGenAI } from '@google/genai';

function getKeys(): string[] {
  const envKeys = process.env.GOOGLE_AI_API_KEYS;
  if (envKeys) {
    return envKeys.split(',').map((k) => k.trim()).filter(Boolean);
  }
  const singleKey = process.env.GOOGLE_AI_API_KEY;
  return singleKey ? [singleKey.trim()] : [];
}

const keys = getKeys();

// Per-key cooldown: tracks the timestamp when a key became exhausted.
// A key is considered "cooled down" after COOLDOWN_MS milliseconds.
const keyCooldowns: Record<string, number> = {};
const COOLDOWN_MS = 60_000; // 1 minute cooldown per exhausted key

/**
 * Returns the next available key index that is not in cooldown.
 * Falls back to the least-recently-exhausted key if all are on cooldown.
 */
function getAvailableKeyIndex(startIndex: number): number {
  const now = Date.now();

  // First pass: find a key that is not in cooldown
  for (let i = 0; i < keys.length; i++) {
    const idx = (startIndex + i) % keys.length;
    const cooldownUntil = keyCooldowns[keys[idx]] ?? 0;
    if (now >= cooldownUntil) {
      return idx;
    }
  }

  // All keys are on cooldown — pick the one whose cooldown expires soonest
  let earliestIdx = startIndex;
  let earliestExpiry = Infinity;
  for (let i = 0; i < keys.length; i++) {
    const idx = (startIndex + i) % keys.length;
    const expiry = keyCooldowns[keys[idx]] ?? 0;
    if (expiry < earliestExpiry) {
      earliestExpiry = expiry;
      earliestIdx = idx;
    }
  }

  // Wait for that key to cool down
  const waitMs = earliestExpiry - now;
  if (waitMs > 0) {
    console.warn(`[Gemini API] All keys on cooldown. Waiting ${Math.ceil(waitMs / 1000)}s for next available key...`);
  }

  return earliestIdx;
}

/**
 * Executes a Gemini API operation using the new @google/genai SDK.
 * Automatically rotates keys on 429/503 errors with exponential backoff.
 *
 * @param operation - An async function that receives a GoogleGenAI instance and returns a result.
 */
export async function executeWithGemini<T>(
  operation: (client: GoogleGenAI) => Promise<T>
): Promise<T> {
  if (keys.length === 0) {
    throw new Error(
      'No Google AI API keys configured. Please set GOOGLE_AI_API_KEYS or GOOGLE_AI_API_KEY in .env'
    );
  }

  let currentKeyIndex = getAvailableKeyIndex(0);
  let attempts = 0;
  const maxAttempts = keys.length * 2; // Allow cycling through keys twice before giving up

  while (attempts < maxAttempts) {
    const key = keys[currentKeyIndex];
    const client = new GoogleGenAI({ apiKey: key });

    try {
      const result = await operation(client);
      // Success — clear any cooldown for this key
      delete keyCooldowns[key];
      return result;
    } catch (error: any) {
      const status = error?.status ?? error?.httpStatus;
      const message = error?.message ?? '';

      const isRateLimitError =
        status === 429 ||
        message.includes('429') ||
        message.includes('RESOURCE_EXHAUSTED') ||
        message.includes('quota');

      const isOverloadError =
        status === 503 ||
        message.includes('503') ||
        message.includes('overloaded') ||
        message.includes('UNAVAILABLE');

      if (isRateLimitError || isOverloadError) {
        const errorType = isRateLimitError ? 'Rate limit (429)' : 'Overloaded (503)';
        console.warn(
          `[Gemini API] ${errorType} on key ...${key.slice(-4)}. Rotating to next key. (Attempt ${attempts + 1}/${maxAttempts})`
        );

        // Mark this key as exhausted with a cooldown
        keyCooldowns[key] = Date.now() + COOLDOWN_MS;
        attempts++;

        // Exponential backoff: 500ms, 1s, 2s, 4s...
        const backoffMs = Math.min(500 * Math.pow(2, attempts - 1), 8000);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));

        // Move to next available key
        currentKeyIndex = getAvailableKeyIndex((currentKeyIndex + 1) % keys.length);
      } else {
        // Non-retriable error (e.g., 400 Bad Request, invalid schema, etc.)
        // Log the full error for debugging and throw immediately.
        console.error(`[Gemini API] Non-retriable error on key ...${key.slice(-4)}:`, {
          status,
          message,
          error,
        });
        throw error;
      }
    }
  }

  throw new Error(
    `[Gemini API] All ${keys.length} API key(s) failed after ${maxAttempts} attempts. ` +
    `Check your quota at https://aistudio.google.com/`
  );
}
