export async function duckduckgoSearch(query: string): Promise<string> {
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' news latest')}&df=w`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      // Next.js specific fetch options to not cache this
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error(`DuckDuckGo search failed: ${response.status} ${response.statusText}`);
      return '';
    }

    const html = await response.text();
    
    // Regex from footykorner: /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g
    const snippetRegex = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    const snippets: string[] = [];
    let match;

    while ((match = snippetRegex.exec(html)) !== null) {
      // Clean up the HTML tags from the snippet
      const cleanText = match[1].replace(/<[^>]*>?/gm, '').trim();
      if (cleanText) {
        snippets.push(cleanText);
      }
      if (snippets.length >= 10) break; // Top 10 snippets
    }

    return snippets.join('\n---\n');
  } catch (error) {
    console.error('Error during DuckDuckGo search:', error);
    return '';
  }
}
