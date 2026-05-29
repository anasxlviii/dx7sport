import { generateContentAI } from './ai.mjs'
import { getBestBackdrop } from './image-search.mjs'

// Simple XML parsing matching news route
function extractGoogleNewsItems(xml) {
  const items = []
  const matches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)
  for (const match of matches) {
    const itemXml = match[1]
    const heading = itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1] || ''
    if (heading) {
      items.push({ title: heading })
    }
  }
  return items
}

async function searchReddit(query) {
  try {
    console.log(`[Reddit Scraper] Searching Reddit (via DDG site search) for: "${query}"...`)
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent("site:reddit.com " + query)}`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
    if (!res.ok) return ''
    const html = await res.text()
    const results = []
    const matches = html.matchAll(/<a class="result__snippet"[\s\S]*?>([\s\S]*?)<\/a>/g)
    let count = 0
    for (const match of matches) {
      const snippet = match[1].replace(/<[^>]*>/g, '').trim()
      results.push(`[Reddit Thread #${count+1}] ${snippet}`)
      count++
      if (count >= 5) break
    }
    return results.join('\n\n')
  } catch (err) {
    console.error('[Reddit Search Error]', err.message)
    return ''
  }
}

async function searchDdg(query) {
  try {
    console.log(`[Reddit Scraper] Searching DuckDuckGo for: "${query}"...`)
    let searchQuery = query
    if (!/\b(news|controversy|leak|scandal|update|cancel|cast|rumor|rumour)\b/i.test(query)) {
      searchQuery += " news"
    }
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
    if (!res.ok) return ''
    const html = await res.text()
    const results = []
    const matches = html.matchAll(/<a class="result__snippet"[\s\S]*?>([\s\S]*?)<\/a>/g)
    let count = 0
    for (const match of matches) {
      const snippet = match[1].replace(/<[^>]*>/g, '').trim()
      results.push(`[Web News #${count+1}] ${snippet}`)
      count++
      if (count >= 5) break
    }
    return results.join('\n\n')
  } catch (err) {
    console.error('[DDG Search Error]', err.message)
    return ''
  }
}

export async function getLiveRedditNews() {
  console.log('[Reddit Scraper] Starting Google News RSS Curation target fetch...')
  
  try {
    const newsRes = await fetch(
      'https://news.google.com/rss/search?q=movies+OR+series+OR+television+OR+netflix+OR+hollywood+OR+hbo&hl=en-US&gl=US&ceid=US:en',
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
    )
    
    if (!newsRes.ok) {
      console.warn(`[Reddit Scraper] Failed to fetch Google News: HTTP ${newsRes.status}`)
      return null
    }
    
    const xml = await newsRes.text()
    const items = extractGoogleNewsItems(xml)
    
    const filteredItems = items.filter(item => {
      const t = item.title.toLowerCase()
      if (t.includes('softball') || t.includes('baseball') || t.includes('nba') || t.includes('playoffs') || t.includes('cup') || t.includes('championship') || t.includes('soccer')) {
        return false
      }
      return t.includes('movie') || t.includes('series') || t.includes('film') || t.includes('show') || 
             t.includes('actor') || t.includes('actress') || t.includes('cast') || t.includes('star') ||
             t.includes('netflix') || t.includes('hbo') || t.includes('marvel') || t.includes('disney') ||
             t.includes('trailer') || t.includes('season') || t.includes('director') || t.includes('review') ||
             t.includes('cancellation') || t.includes('sequel') || t.includes('box office')
    })
    
    const selectedItem = filteredItems[Math.floor(Math.random() * Math.min(5, filteredItems.length))] || items[0]
    if (!selectedItem) {
      console.warn('[Reddit Scraper] No trending feed targets parsed.')
      return null
    }
    
    let cleanedHeadline = selectedItem.title.split(' - ')[0].trim()
    cleanedHeadline = cleanedHeadline.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim()
    
    console.log(`[Reddit Scraper] Curation target: "${cleanedHeadline}"`)
    
    const redditContext = await searchReddit(cleanedHeadline)
    const ddgContext = await searchDdg(cleanedHeadline)
    
    const compiledContext = `LIVE NEWS TARGET HEADLINE: "${cleanedHeadline}"

REDDIT DISCUSSION POSTS:
${redditContext || 'No Reddit discussions found.'}

WEB SEARCH NEWS RESULTS:
${ddgContext || 'No Web news found.'}`

    const systemPrompt = `You are a high-performance, expert Editor-in-Chief for "Mooviz Hub", a premium Facebook page discussing movies, series, and celebrity news. 
Your mission is to analyze the provided search context, pick the most engaging angle, and rewrite it into a highly engaging, newsy discussion post in Fusha Arabic.

CRITICAL INSTRUCTIONS:
1. TONE: Write in a highly sophisticated, dramatic, and professional news tone (Fusha Arabic), using modern Western numerals (0-9).
2. ALIGNMENT & FONT: The text is displayed inside a premium sci-fi card using 'Noto Kufi Arabic' font. Keep sentences extremely punchy, balanced, and readable.
3. IMAGE QUERY: Generate a highly targeted image search query (English) to find the perfect backdrop picture (e.g. "Marvel Robert Downey Jr Doctor Doom SDCC" or "House of the Dragon season 2"). Output this in a field named exactly \`imageQuery\` (e.g. "Marvel Robert Downey Jr Doctor Doom SDCC").
4. OUTPUT SCHEMA: You must return the output in strict JSON format according to the schema provided.`

    const userPrompt = `TRENDING TOPIC CONTEXT FOR "${cleanedHeadline}":
${compiledContext}

Please analyze the trending context, fact-check it, and generate the final Mooviz Hub poster data in Arabic.`

    const schema = {
      type: 'OBJECT',
      properties: {
        en: { type: 'STRING', description: 'The type string is exact English clean name/headline' },
        ar: { type: 'STRING', description: 'A highly engaging Kufic-style Arabic title (max 8-10 words)' },
        genre: { 
          type: 'STRING', 
          description: 'Choose ONE from: فانتازيا, جريمة, رعب, خيال علمي, دراما تاريخية, دراما, إثارة, غموض, كوميدي, أنمي, أكشن, تاريخي, رسوم متحركة, مغامرة' 
        },
        extract: { type: 'STRING', description: 'Engaging 3-4 line synopsis/news discussion in Fusha Arabic (max 250 characters), inviting people to comment.' },
        imageQuery: { type: 'STRING', description: 'A precise, highly specific search query in English to find the backdrop image' }
      },
      required: ['en', 'ar', 'genre', 'extract', 'imageQuery']
    }

    console.log('[Reddit Scraper] Sending parsed news context to AI curation pipeline...')
    const generated = await generateContentAI({
      systemPrompt,
      userPrompt,
      schema,
      temperature: 0.6
    })
    
    console.log(`[Reddit Scraper] AI completed news curation: "${generated.en}" (${generated.ar})`)
    
    const rawSearchQuery = generated.imageQuery || generated.image_query || generated.searchQuery || generated.search_query || generated.en
    const backdropUrl = await getBestBackdrop(rawSearchQuery)
    
    return {
      en: generated.en,
      ar: generated.ar,
      genre: generated.genre,
      extract: generated.extract,
      imageUrl: backdropUrl
    }
    
  } catch (err) {
    console.error('[Reddit Scraper] Curation pipeline failed:', err.message)
    return null
  }
}
