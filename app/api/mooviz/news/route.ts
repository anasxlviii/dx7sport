import { NextResponse } from 'next/server';
// @ts-ignore
import { getBestBackdrop } from '@/scripts/auto-fb/image-search.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ==================== KEYLESS SEARCH SCRAPERS ====================

async function searchReddit(query: string): Promise<string> {
  try {
    console.log(`[Search Engine] Searching Reddit (via DDG site search) for: "${query}"...`);
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent("site:reddit.com " + query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      cache: 'no-store'
    });
    console.log(`[Search Engine] Reddit (via DDG) Fetch HTTP Status: ${res.status}`);
    if (!res.ok) {
      console.warn(`[Search Engine] Reddit (via DDG) Fetch failed with status ${res.status}`);
      return '';
    }
    const html = await res.text();
    console.log(`[Search Engine] Reddit (via DDG) HTML Length: ${html.length} chars`);
    const results: string[] = [];
    const matches = html.matchAll(/<a class="result__snippet"[\s\S]*?>([\s\S]*?)<\/a>/g);
    let count = 0;
    for (const match of matches) {
      const snippet = match[1].replace(/<[^>]*>/g, '').trim();
      results.push(`[Reddit Thread #${count+1}] ${snippet}`);
      count++;
      if (count >= 5) break;
    }
    console.log(`[Search Engine] Reddit matches found: ${results.length}`);
    return results.join('\n\n');
  } catch (err: any) {
    console.error('[Reddit Search Error]', err);
    return '';
  }
}

async function searchDdg(query: string): Promise<string> {
  try {
    console.log(`[Search Engine] Searching DuckDuckGo for: "${query}"...`);
    let searchQuery = query;
    // Avoid double news keywords
    if (!/\b(news|controversy|leak|scandal|update|cancel|cast|rumor|rumour)\b/i.test(query)) {
      searchQuery += " news";
    }
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      cache: 'no-store'
    });
    console.log(`[Search Engine] DDG Fetch HTTP Status: ${res.status}`);
    if (!res.ok) {
      console.warn(`[Search Engine] DDG Fetch failed with status ${res.status}`);
      return '';
    }
    const html = await res.text();
    console.log(`[Search Engine] DDG HTML Length: ${html.length} chars`);
    const results: string[] = [];
    const matches = html.matchAll(/<a class="result__snippet"[\s\S]*?>([\s\S]*?)<\/a>/g);
    let count = 0;
    for (const match of matches) {
      const snippet = match[1].replace(/<[^>]*>/g, '').trim();
      results.push(`[Web News #${count+1}] ${snippet}`);
      count++;
      if (count >= 5) break;
    }
    console.log(`[Search Engine] DDG matches found: ${results.length}`);
    return results.join('\n\n');
  } catch (err: any) {
    console.error('[DDG Search Error]', err);
    return '';
  }
}

// ==================== UNIFIED HIGH-AVAILABILITY AI PIPELINE ====================

// 1. Direct Gemini fetch with key rotation
async function generateContentGemini(options: { systemPrompt: string; userPrompt: string; schema?: any }) {
  const envKeys = process.env.GOOGLE_AI_API_KEYS;
  const keys = envKeys ? envKeys.split(',').map(k => k.trim()).filter(Boolean) : [];
  const singleKey = process.env.GOOGLE_AI_API_KEY;
  if (singleKey && !keys.includes(singleKey.trim())) {
    keys.push(singleKey.trim());
  }

  if (keys.length === 0) {
    throw new Error('No Gemini keys configured');
  }

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    try {
      console.log(`[Gemini Client] Trying key index ${i} (...${key.slice(-4)})...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${options.systemPrompt}\n\n${options.userPrompt}` }] }],
          generationConfig: {
            responseMimeType: options.schema ? 'application/json' : 'text/plain',
            responseSchema: options.schema,
            temperature: 0.6
          }
        })
      });

      if (res.status === 429 || res.status === 503) {
        console.warn(`[Gemini Client] Rate limited (...${key.slice(-4)}), rotating key...`);
        continue;
      }

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini status ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      console.log('[Gemini Client] Raw generated text:', text);

      if (options.schema) {
        try {
          const parsed = JSON.parse(text);
          if (parsed.properties) return parsed.properties;
          if (parsed.response) return parsed.response;
          return parsed;
        } catch {
          const cleaned = text.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(cleaned);
          if (parsed.properties) return parsed.properties;
          if (parsed.response) return parsed.response;
          return parsed;
        }
      }
      return text;
    } catch (err: any) {
      console.warn(`[Gemini Client] Error on key index ${i}:`, err.message);
      if (i === keys.length - 1) {
        throw err;
      }
    }
  }
  throw new Error('All Gemini keys rate-limited or failed');
}

// 2. Direct Groq fetch with model rotation fallback (llama-3.3 -> llama-3.1 -> llama3)
async function generateContentGroq(options: { systemPrompt: string; userPrompt: string; schema?: any }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('No Groq key configured');
  }

  const models = ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'llama3-70b-8192'];
  for (const model of models) {
    try {
      console.log(`[Groq Client] Trying model: ${model}...`);
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: options.systemPrompt },
            { role: 'user', content: options.userPrompt }
          ],
          response_format: options.schema ? { type: 'json_object' } : undefined,
          temperature: 0.6
        })
      });

      if (res.status === 429 || res.status === 503) {
        console.warn(`[Groq Client] Model ${model} rate-limited, rotating model...`);
        continue;
      }

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[Groq Client] Model ${model} failed with status ${res.status}: ${errText}`);
        continue;
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '{}';
      console.log(`[Groq Client] Raw generated text for model ${model}:`, text);

      if (options.schema) {
        try {
          const parsed = JSON.parse(text);
          if (parsed.properties) return parsed.properties;
          if (parsed.response) return parsed.response;
          return parsed;
        } catch {
          const cleaned = text.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(cleaned);
          if (parsed.properties) return parsed.properties;
          if (parsed.response) return parsed.response;
          return parsed;
        }
      }
      return text;
    } catch (err: any) {
      console.warn(`[Groq Client] Exception on model ${model}:`, err.message);
    }
  }
  throw new Error('All Groq models rate-limited or failed');
}

// 3. Unified high-availability coordinator
async function generateContentAI(options: { systemPrompt: string; userPrompt: string; schema?: any }) {
  try {
    return await generateContentGemini(options);
  } catch (geminiErr: any) {
    console.warn('[AI Pipeline] Gemini failed or rate-limited. Falling back to Groq...', geminiErr.message);
    try {
      return await generateContentGroq(options);
    } catch (groqErr: any) {
      console.error('[AI Pipeline] Both Gemini and Groq failed.', groqErr.message);
      throw new Error(`AI services unavailable: ${groqErr.message}`);
    }
  }
}

// ==================== STYLISH FB ENGAGEMENT PLUGINS ====================

const ENGAGEMENT_CTAS = [
  'ما هي توقعاتكم لهذا الخبر؟ شاركونا آراءكم في التعليقات! 👇',
  'هل أنتم متحمسون لهذه التطورات؟ شاركونا نقاشاتكم في التعليقات! 👇',
  'ما هو رأيكم وتوقعاتكم بخصوص هذا العمل؟ اكتبوا لنا في التعليقات! 👇',
  'هل تفضلون متابعة هذا النوع من التحديثات؟ شاركونا آرائكم! 👇',
  'ما هي توقعاتكم لنجاح أو فشل هذه الخطوة؟ اكتبوا لنا آرائكم! 👇'
];

function getRandomCta() {
  return ENGAGEMENT_CTAS[Math.floor(Math.random() * ENGAGEMENT_CTAS.length)];
}

// ==================== ENDPOINT HANDLER ====================

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'reddit';
    const title = searchParams.get('title');
    const customContext = searchParams.get('context') || '';

    const systemPrompt = `You are a high-performance, expert Editor-in-Chief for "Mooviz Hub", a premium Facebook page discussing movies, series, and celebrity news. 
Your mission is to synthesize the provided live search results and news snippets into a highly engaging, newsy discussion post in Fusha Arabic.

CRITICAL TRANSLATION & TITLING INSTRUCTIONS:
1. STRICTLY BAN literal translations of movie/series/show titles if the translation sounds unnatural or is not widely recognized in Arabic media! (For example, "Breaking Bad" must be transliterated phonetically as "بريكينغ باد" and NEVER "اختلال ضال"; "Better Call Saul" must be "بيتر كول سول" and NEVER "اتصل ب Saul" or "من الأفضل الاتصال بسول"; "Stranger Things" must be "سترينجر ثينغز" and NEVER "أشياء غريبة"; "The Witcher" must be "ذا ويتشر" and NEVER "الساحر"; "The Boys" must be "ذا بويز" and NEVER "الأولاد"; "Pulp Fiction" must be "بولب فيكشن" and NEVER "خيال رخيص"; "Dark" must be "دارك" and NEVER "ظلام").
2. ALLOW sensible and widely-recognized official Arabic translations that make perfect sense (e.g., "Gladiator" -> "المصارع", "The Godfather" -> "العراب", "Game of Thrones" -> "صراع العروش", "Squid Game" -> "لعبة الحبار", "The Walking Dead" -> "الموتى السائرون", "House of the Dragon" -> "بيت التنين", "The Crown" -> "التاج").
3. PHONETIC FALLBACK: For other titles without an official/natural Arabic translation, use their popular phonetic transliterations or write them in English. NEVER do literal word-by-word translations that sound bizarre.
4. RESPECT THE QUERY & COMPOSITION: Focus STRICTLY on the actual news, controversies, leaks, casting updates, or fan discussions requested in the user's query! DO NOT write a dry, generic plot synopsis or background of the show under any circumstances! The title ('ar') and content ('extract') MUST reflect the specific news/controversy/leak. For example, if the query is "Breaking Bad controversy", the title ('ar') should be a dramatic news headline about the controversy (e.g. "الجدل المستمر حول بريكينغ باد" or "قضية دمى بريكينغ باد المثيرة للجدل") and the 'extract' must discuss the specific controversy detail from the search results, NOT general information about Walter White.
5. TONE & WRITING EXCELLENCE: Write in an elite, highly sophisticated, dramatic, and professional news tone (Fusha Arabic). Avoid using boring, generic, or obvious AI-sounding words (like "مفاجأة", "مخيف", "صادم", "رائع", "مثير") unless they are highly contextual and fit naturally into professional journalism. Instead, use rich, evocative, and compelling vocabulary that captures the reader's attention instantly, showcasing extreme content awareness of standard cinema tropes, casting significance, fan culture, and media history. Use modern Western numerals (0-9) to refer to seasons/years (e.g. 2 instead of ٢).
6. ALIGNMENT & FONT: The text is displayed inside a premium sci-fi card using 'Noto Kufi Arabic' font. Keep sentences extremely punchy, balanced, and readable.
7. IMAGE QUERY: Generate a highly targeted image search query (English, 5-8 words) to find the perfect backdrop picture. Output this in a field named exactly \`imageQuery\` (e.g. "Marvel Robert Downey Jr Doctor Doom SDCC" or "Breaking Bad Aaron Paul Bryan Cranston season 3").
8. OUTPUT SCHEMA: You must return the output in strict JSON format according to the schema provided.
9. 100% PURE ARABIC ONLY: Your synopsis/extract MUST be written in 100% pure Arabic letters. You are strictly forbidden from including any English words, English show titles, or English terms (like 'movies', 'series', 'show', 'season', 'House of the Dragon', 'Game of Thrones', 'HBO') inside the Arabic extract! Every single show title, company name, or term MUST be translated or phonetically transliterated into Arabic letters (e.g. write 'بيت التنين' instead of 'House of the Dragon', write 'إتش بي أو' instead of 'HBO'). This is critical to prevent SVG text rendering overlapping bugs.
10. LENGTH & SENTENCE COMPLETION: The description ('extract') must be exactly between 180 and 240 characters in length. It must consist of 2 to 3 complete, fully-formed, and natural sentences ending with a period. It is strictly forbidden to truncate your paragraph or cut off the text mid-sentence or mid-word!
11. ADDITIONAL USER-PROVIDED CONTEXT: If 'ADDITIONAL USER-PROVIDED CONTEXT / CUSTOM DIRECTIONS' is present in the context, you MUST fully prioritize and strictly respect the facts, guidelines, or text provided by the user! Use this text as the primary source of truth and shape the synthesis according to the user's specific directions, while keeping the Fusha Arabic poster constraints.
12. FACEBOOK POST CAPTION: In addition to the short poster 'extract', you MUST generate a longer, highly engaging, rephrased and extended Facebook post caption in 100% pure Arabic ('caption') of exactly 500 to 1000 characters. This caption should provide a comprehensive, exciting, and extended detailed read for the viewer, structured with clean paragraph breaks (using newlines), giving a detailed narrative and discussion with high content awareness (mentioning directors, studios, streaming platforms, and historical comparisons where relevant), and ending with a highly engaging call to action to comment.
13. EMPTY INPUT TITLE & CONTEXT DRIVER: If the search query or title is 'Custom Curation', empty, or blank, the user's custom context is the complete driver! In this case, you MUST extract and invent a highly catchy, professional, and news-worthy English title ('en') and its translation/transliteration Arabic title ('ar') directly from the details inside the custom context. Do NOT use placeholder titles like 'Custom Curation'.`;

    const schema = {
      type: 'OBJECT',
      properties: {
        en: { type: 'STRING', description: 'The English clean name/headline of the news topic. If the search title is empty/Custom Curation, you MUST synthesize a highly catchy, professional English title directly from the custom context!' },
        ar: { type: 'STRING', description: 'A highly engaging Arabic title (max 8-10 words). Must use the correct Arabic transliteration for show titles! If the search title is empty/Custom Curation, you MUST synthesize a highly catchy, professional Arabic title directly from the custom context!' },
        genre: { 
          type: 'STRING', 
          description: 'Choose ONE from: فانتازيا, جريمة, رعب, خيال علمي, دراما تاريخية, دراما, إثارة, غموض, كوميدي, أنمي, أكشن, تاريخي, رسوم متحركة, مغامرة' 
        },
        extract: { type: 'STRING', description: 'Engaging, professional news discussion in 100% Fusha Arabic (exactly 180-240 characters) to print physically on the poster. Must contain NO English words. Must consist of 2-3 complete sentences ending with a period. Do NOT exceed 240 characters so it fits completely on the poster without truncation!' },
        caption: { type: 'STRING', description: 'A longer, highly engaging, rephrased and extended Facebook post caption in Arabic (exactly 500-1000 characters) providing a detailed and comprehensive read for the viewer with rich storytelling and deep context, structured with paragraphs, ending with an engagement CTA.' },
        imageQuery: { type: 'STRING', description: 'IMPORTANT — key must be exactly "imageQuery": A precise, highly specific English search query (5-8 words) to find the best backdrop photo for this news item. E.g. "Robert Downey Jr Doctor Doom Marvel SDCC" or "Breaking Bad Aaron Paul Bryan Cranston".' }
      },
      required: ['en', 'ar', 'genre', 'extract', 'caption', 'imageQuery']
    };

    // ==================== SMART NEWS/DETAILS FETCH (by Title/Query) ====================
    if (action === 'custom') {
      let searchTitle = title || '';
      if (!searchTitle.trim() && customContext.trim()) {
        searchTitle = 'Custom Curation';
      }

      if (!searchTitle.trim()) {
        return NextResponse.json({ error: 'Title/Query or Custom Context is required for fetch' }, { status: 400 });
      }

      console.log(`[Search API] Starting smart details curation for: "${searchTitle}"...`);

      // 1. Scrape Reddit & DuckDuckGo Search results (only if title is not dummy)
      let redditContext = '';
      let ddgContext = '';
      if (searchTitle !== 'Custom Curation') {
        redditContext = await searchReddit(searchTitle);
        ddgContext = await searchDdg(searchTitle);
      }
      
      let compiledContext = `USER SEARCH QUERY: "${searchTitle}"`;
      if (customContext) {
        compiledContext += `\n\nADDITIONAL USER-PROVIDED CONTEXT / CUSTOM DIRECTIONS:\n${customContext}`;
      }
      compiledContext += `\n\nREDDIT DISCUSSION POSTS:\n${redditContext || 'No Reddit posts found.'}`;
      compiledContext += `\n\nWEB SEARCH NEWS RESULTS:\n${ddgContext || 'No Web news found.'}`;

      const userPrompt = `LIVE SEARCH RESULTS AND CUSTOM CONTEXT FOR "${searchTitle}":
${compiledContext}

Please analyze the search results and user-provided context/directions, understand what news, updates, leaks, or controversies exist about "${searchTitle}", and generate the final Mooviz Hub poster data in Arabic according to the instructions.`;

      // 2. Execute AI Pipeline (Gemini/Groq)
      const generated = await generateContentAI({
        systemPrompt,
        userPrompt,
        schema
      });

      let rawAr = generated.ar || generated.titleAr || generated.arabicTitle || '';
      let rawEn = generated.en || generated.titleEn || generated.englishTitle || '';

      if (generated.title) {
        if (typeof generated.title === 'object' && generated.title !== null) {
          if (!rawAr) rawAr = generated.title.ar || generated.title.arabic || '';
          if (!rawEn) rawEn = generated.title.en || generated.title.english || '';
        } else if (typeof generated.title === 'string') {
          if (!rawAr) rawAr = generated.title;
        }
      }

      if (!rawAr) rawAr = (searchTitle === 'Custom Curation' ? 'منشور مخصص' : searchTitle);
      if (!rawEn) rawEn = (searchTitle === 'Custom Curation' ? 'Custom Post' : searchTitle);

      if (typeof rawAr !== 'string') rawAr = String(rawAr || '');
      if (typeof rawEn !== 'string') rawEn = String(rawEn || '');

      let rawExtract = generated.extract || generated.content || generated.synopsis || generated.description || generated.body || '';
      if (typeof rawExtract !== 'string') rawExtract = String(rawExtract || '');

      let rawSearchQuery = generated.searchQuery || generated.search_query || generated.imageQuery || generated.image_query || generated.imageSearchQuery || generated.image_search_query || generated.query || '';
      if (typeof rawSearchQuery !== 'string') rawSearchQuery = String(rawSearchQuery || '');

      const rawGenre = generated.genre || generated.category || detectGenre(rawEn, rawExtract);

      console.log(`[Search API] AI Curation completed: "${rawEn}" -> "${rawAr}"`);

      // 3. Fetch Backdrop image — never use placeholder titles as image queries
      const PLACEHOLDER_TITLES = ['Custom Curation', 'Custom Post', 'منشور مخصص'];
      const safeBackdropQuery = rawSearchQuery || rawEn || (!PLACEHOLDER_TITLES.includes(searchTitle) ? searchTitle : '');
      const backdropUrl = await getBestBackdrop(safeBackdropQuery) || '';

      // Clean extract and enforce Western numbers (poster synopsis - NO CTA!)
      let arabicSummary = rawExtract;
      arabicSummary = arabicSummary.replace(/٠/g, '0').replace(/١/g, '1').replace(/٢/g, '2').replace(/٣/g, '3').replace(/٤/g, '4').replace(/٥/g, '5').replace(/٦/g, '6').replace(/٧/g, '7').replace(/٨/g, '8').replace(/٩/g, '9');
      const finalSummary = arabicSummary.trim();

      // Clean and extended Facebook caption
      const rawCaption = generated.caption || generated.extended_caption || generated.facebook_caption || rawExtract || '';
      let finalCaption = rawCaption.replace(/٠/g, '0').replace(/١/g, '1').replace(/٢/g, '2').replace(/٣/g, '3').replace(/٤/g, '4').replace(/٥/g, '5').replace(/٦/g, '6').replace(/٧/g, '7').replace(/٨/g, '8').replace(/٩/g, '9');
      if (!finalCaption.includes('👇')) {
        finalCaption = `${finalCaption.trim()}\n\n${getRandomCta()}`;
      }

      return NextResponse.json({
        en: rawEn,
        ar: rawAr,
        genre: rawGenre,
        extract: finalSummary,
        caption: finalCaption,
        imageUrl: backdropUrl
      });
    }

    // ==================== GENERAL LIVE NEWS SCRAP ====================
    console.log('[Search API] Scraping general trending entertainment news from Google News RSS...');
    const newsRes = await fetch(
      'https://news.google.com/rss/search?q=movies+OR+series+OR+television+OR+netflix+OR+hollywood+OR+hbo&hl=en-US&gl=US&ceid=US:en',
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
    );

    if (!newsRes.ok) {
      return NextResponse.json({ error: `Failed to fetch Google News: HTTP ${newsRes.status}` }, { status: newsRes.status });
    }

    const xml = await newsRes.text();
    const items: { title: string; description: string; link: string }[] = [];
    const matches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
    for (const match of matches) {
      const itemXml = match[1];
      const heading = itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '';
      if (heading) {
        items.push({ title: heading, description: '', link: '' });
      }
    }

    const filteredItems = items.filter(item => {
      const t = item.title.toLowerCase();
      if (t.includes('softball') || t.includes('baseball') || t.includes('nba') || t.includes('playoffs') || t.includes('cup') || t.includes('championship') || t.includes('soccer')) {
        return false;
      }
      return t.includes('movie') || t.includes('series') || t.includes('film') || t.includes('show') || 
             t.includes('actor') || t.includes('actress') || t.includes('cast') || t.includes('star') ||
             t.includes('netflix') || t.includes('hbo') || t.includes('marvel') || t.includes('disney') ||
             t.includes('trailer') || t.includes('season') || t.includes('director') || t.includes('review') ||
             t.includes('cancellation') || t.includes('sequel') || t.includes('box office');
    });

    const selectedItem = filteredItems[Math.floor(Math.random() * Math.min(5, filteredItems.length))] || items[0];
    if (!selectedItem) {
      return NextResponse.json({ error: 'No entertainment news found.' }, { status: 404 });
    }

    let cleanedHeadline = selectedItem.title.split(' - ')[0].trim();
    cleanedHeadline = cleanedHeadline.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim();

    console.log(`[Search API] Curation target headline: "${cleanedHeadline}"`);

    // 1. Scrape Reddit & DDG news about this headline
    const redditContext = await searchReddit(cleanedHeadline);
    const ddgContext = await searchDdg(cleanedHeadline);

    const compiledContext = `LIVE NEWS TARGET HEADLINE: "${cleanedHeadline}"

REDDIT DISCUSSION POSTS:
${redditContext || 'No Reddit posts found.'}

WEB SEARCH NEWS RESULTS:
${ddgContext || 'No Web news found.'}`;

    const userPrompt = `LIVE NEWS ANALYSIS FOR "${cleanedHeadline}":
${compiledContext}

Please analyze the search results, understand what news, updates, leaks, or controversies exist about "${cleanedHeadline}", and generate the final Mooviz Hub poster data in Arabic according to the instructions.`;

    // 2. Execute AI Pipeline (Gemini/Groq)
    const generated = await generateContentAI({
      systemPrompt,
      userPrompt,
      schema
    });

    let rawAr = generated.ar || generated.titleAr || generated.arabicTitle || '';
    let rawEn = generated.en || generated.titleEn || generated.englishTitle || '';

    if (generated.title) {
      if (typeof generated.title === 'object' && generated.title !== null) {
        if (!rawAr) rawAr = generated.title.ar || generated.title.arabic || '';
        if (!rawEn) rawEn = generated.title.en || generated.title.english || '';
      } else if (typeof generated.title === 'string') {
        if (!rawAr) rawAr = generated.title;
      }
    }

    if (!rawAr) rawAr = cleanedHeadline;
    if (!rawEn) rawEn = cleanedHeadline;

    if (typeof rawAr !== 'string') rawAr = String(rawAr || '');
    if (typeof rawEn !== 'string') rawEn = String(rawEn || '');

    let rawExtract = generated.extract || generated.content || generated.synopsis || generated.description || generated.body || '';
    if (typeof rawExtract !== 'string') rawExtract = String(rawExtract || '');

    let rawSearchQuery = generated.searchQuery || generated.search_query || generated.imageQuery || generated.image_query || generated.imageSearchQuery || generated.image_search_query || generated.query || '';
    if (typeof rawSearchQuery !== 'string') rawSearchQuery = String(rawSearchQuery || '');

    const rawGenre = generated.genre || generated.category || detectGenre(rawEn, rawExtract);

    console.log(`[Search API] AI News completed: "${rawEn}" -> "${rawAr}"`);

    // 3. Fetch Backdrop image
    const backdropUrl = await getBestBackdrop(rawSearchQuery || rawEn || cleanedHeadline) || '';

    // Clean extract and enforce Western numbers (poster synopsis - NO CTA!)
    let arabicSummary = rawExtract;
    arabicSummary = arabicSummary.replace(/٠/g, '0').replace(/١/g, '1').replace(/٢/g, '2').replace(/٣/g, '3').replace(/٤/g, '4').replace(/٥/g, '5').replace(/٦/g, '6').replace(/٧/g, '7').replace(/٨/g, '8').replace(/٩/g, '9');
    const finalSummary = arabicSummary.trim();

    // Clean and extended Facebook caption
    const rawCaption = generated.caption || generated.extended_caption || generated.facebook_caption || rawExtract || '';
    let finalCaption = rawCaption.replace(/٠/g, '0').replace(/١/g, '1').replace(/٢/g, '2').replace(/٣/g, '3').replace(/٤/g, '4').replace(/٥/g, '5').replace(/٦/g, '6').replace(/٧/g, '7').replace(/٨/g, '8').replace(/٩/g, '9');
    if (!finalCaption.includes('👇')) {
      finalCaption = `${finalCaption.trim()}\n\n${getRandomCta()}`;
    }

    return NextResponse.json({
      en: rawEn,
      ar: rawAr,
      genre: rawGenre,
      extract: finalSummary,
      caption: finalCaption,
      imageUrl: backdropUrl
    });

  } catch (error: any) {
    console.error('[Search API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// ==================== GENRE DETECTION BACKUP ====================

function detectGenre(title: string, text: string): string {
  const content = `${title} ${text}`.toLowerCase();
  if (content.includes('fantasy') || content.includes('magic') || content.includes('dragon') || content.includes('witch') || content.includes('سحر') || content.includes('تنين') || content.includes('خيال')) return 'فانتازيا';
  if (content.includes('crime') || content.includes('murder') || content.includes('police') || content.includes('mafia') || content.includes('جريمة') || content.includes('قتل') || content.includes('شرطة')) return 'جريمة';
  if (content.includes('horror') || content.includes('scary') || content.includes('zombie') || content.includes('ghost') || content.includes('رعب') || content.includes('مخيف') || content.includes('زومبي')) return 'رعب';
  if (content.includes('sci-fi') || content.includes('space') || content.includes('alien') || content.includes('future') || content.includes('فضاء') || content.includes('مستقبل')) return 'خيال علمي';
  if (content.includes('history') || content.includes('historical') || content.includes('war') || content.includes('تاريخ') || content.includes('حرب')) return 'دراما تاريخية';
  if (content.includes('thriller') || content.includes('suspense') || content.includes('إثارة') || content.includes('تشويق')) return 'إثارة';
  if (content.includes('mystery') || content.includes('detective') || content.includes('غموض') || content.includes('لغز')) return 'غموض';
  if (content.includes('comedy') || content.includes('funny') || content.includes('sitcom') || content.includes('كوميد')) return 'كوميدي';
  if (content.includes('anime') || content.includes('manga') || content.includes('أنمي') || content.includes('مانغا')) return 'أنمي';
  if (content.includes('action') || content.includes('fight') || content.includes('superhero') || content.includes('أكشن') || content.includes('قتال')) return 'أكشن';
  if (content.includes('animation') || content.includes('cartoon') || content.includes('رسوم متحركة') || content.includes('كرتون')) return 'رسوم متحركة';
  if (content.includes('adventure') || content.includes('quest') || content.includes('مغامرة') || content.includes('رحلة')) return 'مغامرة';
  return 'دراما'; // default fallback
}
