import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

export interface ExtractedTopic {
  category: 'news' | 'comparison' | 'poll' | 'match_report' | 'transfer';
  title: string;
  entities: string[];
  keyQuestions: string[];
  searchQueries: string[];
  summary: string;
}

const CATEGORY_PROMPTS = {
  news: 'Breaking news about players, teams, or football events',
  comparison: 'Comparing two or more players, teams, or statistics',
  poll: 'Asking for opinions or votes from the audience',
  match_report: 'Recap or preview of a football match',
  transfer: 'Transfer rumors, confirmed transfers, or market analysis',
};

const SYSTEM_PROMPT = `You are a football content expert. Analyze the given Facebook post and extract structured information.

Categories:
- news: Breaking news about players, teams, or football events
- comparison: Comparing two or more players, teams, or statistics
- poll: Asking for opinions or votes from the audience
- match_report: Recap or preview of a football match
- transfer: Transfer rumors, confirmed transfers, or market analysis

Return ONLY valid JSON in this exact format:
{
  "category": "news|comparison|poll|match_report|transfer",
  "title": "Brief, catchy title for an article",
  "entities": ["list of player names, team names, leagues mentioned"],
  "keyQuestions": ["list of questions this post addresses that fans want answered"],
  "searchQueries": ["3-5 specific search queries to fact-check and expand on this topic"],
  "summary": "1-2 sentence summary of what the post is about"
}`;

export async function extractTopic(postContent: string): Promise<ExtractedTopic> {
  try {
    const result = await model.generateContent([
      SYSTEM_PROMPT,
      `\n\nFacebook post content:\n${postContent}`,
    ]);

    const response = result.response.text().trim();

    // Remove markdown code blocks if present
    const cleanJson = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const parsed = JSON.parse(cleanJson);

    // Validate required fields
    if (!parsed.category || !parsed.title || !Array.isArray(parsed.entities)) {
      throw new Error('Invalid response structure from AI');
    }

    return {
      category: parsed.category,
      title: parsed.title,
      entities: parsed.entities,
      keyQuestions: parsed.keyQuestions || [],
      searchQueries: parsed.searchQueries || [],
      summary: parsed.summary || '',
    };
  } catch (error) {
    console.error('Error extracting topic:', error);

    // Fallback to basic extraction
    return {
      category: 'news',
      title: postContent.slice(0, 50) + '...',
      entities: [],
      keyQuestions: [],
      searchQueries: [postContent.slice(0, 100)],
      summary: postContent.slice(0, 200),
    };
  }
}

export async function extractFromUrl(url: string): Promise<ExtractedTopic> {
  // For now, return a prompt-based extraction
  // In production, you could scrape the FB page or use their API
  return extractTopic(`Facebook post from URL: ${url}. Please analyze the content.`);
}
