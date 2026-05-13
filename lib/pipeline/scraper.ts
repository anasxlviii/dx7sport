export interface ScrapedContent {
  text: string;
  title: string;
  url: string;
  images: string[];
}

async function fetchWithUA(url: string, timeout = 10000): Promise<string> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    return await res.text();
  } finally {
    clearTimeout(id);
  }
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function removeElements(raw: string, selectors: string[]): string {
  let html = raw;
  for (const sel of selectors) {
    if (sel.startsWith('.')) {
      const cls = sel.slice(1);
      const re = new RegExp(`<[^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*>.*?<\\/[^>]+>`, 'gis');
      html = html.replace(re, '');
    } else {
      const re = new RegExp(`<${sel}[^>]*>.*?<\\/${sel}>`, 'gis');
      html = html.replace(re, '');
    }
  }
  return html;
}

function getTextBySelector(html: string, selector: string): string | null {
  if (selector.startsWith('.')) {
    const cls = selector.slice(1);
    const re = new RegExp(`<[^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/[^>]+>`, 'i');
    const m = html.match(re);
    return m ? stripTags(m[1]) : null;
  }
  const re = new RegExp(`<${selector}[^>]*>([\\s\\S]*?)<\\/${selector}>`, 'i');
  const m = html.match(re);
  return m ? stripTags(m[1]) : null;
}

function extractTextFromHTML(html: string): string {
  const cleaned = removeElements(html, ['script', 'style', 'iframe', 'nav', 'footer', 'header']);

  const selectors = ['article', '.article-body', '.entry-content', '.post-content', '.story-body', 'main'];
  for (const sel of selectors) {
    const text = getTextBySelector(cleaned, sel);
    if (text && text.length > 300) return text.slice(0, 5000);
  }

  const pRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  const paragraphs: string[] = [];
  let m;
  while ((m = pRe.exec(cleaned)) !== null) {
    const t = stripTags(m[1]);
    if (t) paragraphs.push(t);
  }
  if (paragraphs.length > 0) {
    const joined = paragraphs.join('\n');
    if (joined.length > 200) return joined.slice(0, 5000);
  }

  const bodyRe = /<body[^>]*>([\s\S]*?)<\/body>/i;
  const bodyMatch = html.match(bodyRe);
  if (bodyMatch) return stripTags(bodyMatch[1]).slice(0, 5000);
  return stripTags(html).slice(0, 5000);
}

function extractTitle(html: string): string {
  const og = html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
  if (og) return og[1];

  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (title) return stripTags(title[1]);

  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) return stripTags(h1[1]);

  return 'Untitled';
}

export async function scrapeUrl(url: string): Promise<ScrapedContent | null> {
  try {
    if (url.includes('facebook.com') || url.includes('fb.watch')) {
      return await scrapeFacebookPost(url);
    }

    const html = await fetchWithUA(url);
    const text = extractTextFromHTML(html);
    const title = extractTitle(html);

    return { text, title, url, images: [] };
  } catch (error) {
    console.error('Failed to scrape URL:', error);
    return null;
  }
}

async function scrapeFacebookPost(url: string): Promise<ScrapedContent | null> {
  const strategies = [
    async () => {
      const mbasicUrl = url
        .replace('www.facebook.com', 'mbasic.facebook.com')
        .replace('m.facebook.com', 'mbasic.facebook.com');
      return await fetchWithUA(mbasicUrl, 12000);
    },
    async () => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 12000);
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        });
        return await res.text();
      } finally {
        clearTimeout(id);
      }
    },
    async () => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 12000);
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        });
        return await res.text();
      } finally {
        clearTimeout(id);
      }
    },
  ];

  for (const strategy of strategies) {
    try {
      const html = await strategy();
      const title = extractTitle(html);
      const descMatch = html.match(/property=["']og:description["'][^>]*content=["']([^"']{10,})["']/i)
        || html.match(/content=["']([^"']{10,})["'][^>]*property=["']og:description["']/i);
      const postBodyMatch = html.match(/<div[^>]*data-ft[^>]*>([\s\S]{20,}?)<\/div>/i)
        || html.match(/class="[^"]*story_body[^"]*"[^>]*>([\s\S]{20,}?)<\/div>/i);

      let text = '';
      if (descMatch && descMatch[1].length > 20) {
        text = descMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      } else if (postBodyMatch) {
        text = stripTags(postBodyMatch[1]).slice(0, 2000);
      } else if (title && title !== 'Facebook') {
        text = title;
      }

      const imageMatch = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
      const images = imageMatch ? [imageMatch[1].replace(/&amp;/g, '&')] : [];

      if (text && text.length > 15) {
        console.log(`[Scraper] Facebook: extracted ${text.length} chars via strategy`);
        return { text, title: title || 'Facebook Post', url, images };
      }
    } catch (err) {
      console.warn('[Scraper] Facebook strategy failed:', (err as any)?.message);
    }
  }

  console.warn('[Scraper] All Facebook strategies failed for:', url);
  return null;
}

export async function scrapeArticle(url: string): Promise<string> {
  const scraped = await scrapeUrl(url);
  if (!scraped) return '';
  return scraped.text;
}
