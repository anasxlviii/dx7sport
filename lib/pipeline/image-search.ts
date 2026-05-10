/**
 * DuckDuckGo Image Search
 * Uses DDG's unofficial image search API to pull real web images - no API key needed.
 */
import { executeWithGemini } from './gemini-client';

export interface ImageResult {
  url: string;
  title: string;
  thumbnail: string;
  source: string;
}

/**
 * Fetches a DuckDuckGo VQD token required for subsequent image API calls.
 */
async function getDdgToken(query: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
      }
    );
    const html = await res.text();
    const match = html.match(/vqd=['"]([^'"]+)['"]/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Searches DuckDuckGo for images and returns the first few real results.
 */
export async function searchImages(
  query: string,
  count = 3
): Promise<ImageResult[]> {
  try {
    const vqd = await getDdgToken(query);
    if (!vqd) {
      console.warn('[ImageSearch] Could not get DDG token for:', query);
      return [];
    }

    const params = new URLSearchParams({
      l: 'us-en',
      o: 'json',
      q: query,
      vqd,
      f: ',,,,,',
      p: '1',
    });

    const res = await fetch(`https://duckduckgo.com/i.js?${params}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Referer: 'https://duckduckgo.com/',
      },
    });

    if (!res.ok) {
      console.warn('[ImageSearch] DDG image API returned:', res.status);
      return [];
    }

    const data = await res.json();
    const results: ImageResult[] = [];

    for (const item of data.results?.slice(0, count * 2) || []) {
      // Filter out low-quality sources or trackers
      if (!item.image || !item.image.startsWith('http')) continue;
      // Prefer .jpg or .png
      if (!/\.(jpg|jpeg|png|webp)/i.test(item.image)) continue;
      results.push({
        url: item.image,
        title: item.title || query,
        thumbnail: item.thumbnail || item.image,
        source: item.url || '',
      });
      if (results.length >= count) break;
    }

    return results;
  } catch (err) {
    console.error('[ImageSearch] Error:', err);
    return [];
  }
}

/**
 * AI-Driven Contextual Image Selection.
 * Takes the top 5-7 results from search and asks Gemini to pick the most relevant one.
 */
export async function selectBestImage(query: string, contextSummary?: string): Promise<string | null> {
  const results = await searchImages(query, 7);
  if (results.length === 0) return null;
  if (results.length === 1) return results[0].url;

  try {
    const result = await executeWithGemini(async (client) => {
      const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const res = await model.generateContent(`You are a professional Photo Editor for a sports news site. 
            ARTICLE CONTEXT: ${contextSummary || query}
            
            Below are 7 image search results for the query: "${query}".
            Pick the ONE image that is most likely to be a high-quality, professional photograph directly relevant to the article context. 
            Avoid generic logos, unrelated thumbnails, or low-quality graphics.
            
            RESULTS:
            ${results.map((r, i) => `[ID: ${i}] TITLE: ${r.title} | SOURCE: ${r.source}`).join('\n')}
            
            Return ONLY the ID number of the best image.`);
      return res.response;
    });

    const bestId = parseInt(result.text()?.trim() || '0');
    const selected = results[bestId] || results[0];
    return selected.url;
  } catch (error) {
    console.error('[ImageSearch] AI selection failed, falling back to first result:', error);
    return results[0].url;
  }
}

/**
 * Convenience: get the single best image URL for a topic.
 * Now uses the AI selection logic by default.
 */
export async function getBestImage(query: string, contextSummary?: string): Promise<string | null> {
  return selectBestImage(query, contextSummary);
}
