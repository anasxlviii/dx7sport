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
  try {
    // Facebook requires a bot user-agent to return og tags without requiring login
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      },
      timeout: 10000,
    });

    const html = response.data;
    const title = extractTitle(html) || 'Facebook Post';
    
    // Facebook puts the post content in og:description or sometimes title
    const descriptionMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
    const text = descriptionMatch ? descriptionMatch[1] : title;
    
    // Extract og:image
    const imageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["'][^>]*>/i);
    const images = imageMatch ? [imageMatch[1].replace(/&amp;/g, '&')] : [];

    return {
      text,
      title,
      url,
      images,
    };
  } catch (error) {
    console.error('Failed to scrape Facebook:', error);
    return null;
  }
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
