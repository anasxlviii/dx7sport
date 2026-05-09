/**
 * DuckDuckGo Image Search
 * Uses DDG's unofficial image search API to pull real web images - no API key needed.
 */

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
 * Convenience: get the single best image URL for a topic.
 */
export async function getBestImage(query: string): Promise<string | null> {
  const results = await searchImages(query, 3);
  return results[0]?.url || null;
}
