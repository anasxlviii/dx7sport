import axios from 'axios';

export interface ScrapedContent {
  text: string;
  title: string;
  url: string;
  images: string[];
}

/**
 * Fetches content from a URL
 * For Facebook posts, we'll use a basic approach
 */
export async function scrapeUrl(url: string): Promise<ScrapedContent | null> {
  try {
    // For Facebook posts, we need to handle them specially
    if (url.includes('facebook.com') || url.includes('fb.watch')) {
      return await scrapeFacebookPost(url);
    }

    // For generic URLs
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    });

    // Basic extraction from HTML
    const text = extractTextFromHTML(response.data);
    const title = extractTitle(response.data);

    return {
      text,
      title,
      url,
      images: [],
    };
  } catch (error) {
    console.error('Failed to scrape URL:', error);
    return null;
  }
}

async function scrapeFacebookPost(url: string): Promise<ScrapedContent | null> {
  const strategies = [
    // Strategy 1: mbasic (lightweight mobile version - no JS required)
    async () => {
      const mbasicUrl = url
        .replace('www.facebook.com', 'mbasic.facebook.com')
        .replace('m.facebook.com', 'mbasic.facebook.com');
      const response = await axios.get(mbasicUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml',
          'Cookie': '',
        },
        timeout: 12000,
        maxRedirects: 5,
      });
      return response.data as string;
    },
    // Strategy 2: External hit user agent (makes Facebook serve OG tags)
    async () => {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 12000,
        maxRedirects: 5,
      });
      return response.data as string;
    },
    // Strategy 3: Googlebot UA (sometimes bypasses FB gate)
    async () => {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 12000,
        maxRedirects: 5,
      });
      return response.data as string;
    },
  ];

  for (const strategy of strategies) {
    try {
      const html = await strategy();
      
      // Try to extract meaningful text content (not just OG tags)
      const title = extractTitle(html);
      
      // Extract OG description
      const descMatch = html.match(/property=["']og:description["'][^>]*content=["']([^"']{10,})["']/i)
        || html.match(/content=["']([^"']{10,})["'][^>]*property=["']og:description["']/i);
      
      // For mbasic, try to extract the post body text
      const postBodyMatch = html.match(/<div[^>]*data-ft[^>]*>([\s\S]{20,}?)<\/div>/i)
        || html.match(/class="[^"]*story_body[^"]*"[^>]*>([\s\S]{20,}?)<\/div>/i);
      
      let text = '';
      if (descMatch && descMatch[1].length > 20) {
        text = descMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      } else if (postBodyMatch) {
        text = postBodyMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000);
      } else if (title && title !== 'Facebook') {
        text = title;
      }

      // Extract OG image
      const imageMatch = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
      const images = imageMatch ? [imageMatch[1].replace(/&amp;/g, '&')] : [];
      
      if (text && text.length > 15) {
        console.log(`[Scraper] Facebook: extracted ${text.length} chars via strategy`);
        return { text, title: title || 'Facebook Post', url, images };
      }
    } catch (err) {
      // Try next strategy
      console.warn('[Scraper] Facebook strategy failed:', (err as any)?.message);
    }
  }

  console.warn('[Scraper] All Facebook strategies failed for:', url);
  return null;
}

function extractTextFromHTML(html: string): string {
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>.*?<\/script>/gi, '')
                 .replace(/<style[^>]*>.*?<\/style>/gi, '');

  // Extract meta description
  const metaMatch = text.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  if (metaMatch) {
    return metaMatch[1];
  }

  // Extract from OpenGraph
  const ogMatch = text.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  if (ogMatch) {
    return ogMatch[1];
  }

  // Fallback: remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/\s+/g, ' ').trim();

  return text.slice(0, 5000); // Limit length
}

function extractTitle(html: string): string {
  // Try OpenGraph title
  const ogMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  if (ogMatch) return ogMatch[1];

  // Try regular title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch) return titleMatch[1];

  return 'Untitled';
}

/**
 * Extract article content from common article patterns
 */
export async function scrapeArticle(url: string): Promise<string> {
  const scraped = await scrapeUrl(url);
  if (!scraped) return '';

  return scraped.text;
}
