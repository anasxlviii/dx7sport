import { GoogleGenAI, Type, Schema } from '@google/genai';
import type { ExtractedTopic } from './extract-topic';
import { duckduckgoSearch } from './deep-search';
import { executeWithAI } from './ai-client';

/**
 * Sanitizes AI-generated article content:
 * 1. Converts literal \n escape sequences to real newlines
 * 2. Ensures markdown headings (##, ###) have blank lines before/after them
 * 3. Removes stray backslash artifacts
 */
function sanitizeArticleContent(raw: string): string {
  let text = raw;

  // Step 1: Convert literal escaped newlines (\\n) to real newlines
  text = text.replace(/\\n/g, '\n');

  // Step 2: Collapse excessive blank lines (more than 2) to exactly 2
  text = text.replace(/\n{3,}/g, '\n\n');

  // Step 3: Ensure headings always have a blank line before them
  text = text.replace(/([^\n])\n(#{1,3} )/g, '$1\n\n$2');

  // Step 4: Ensure headings always have a blank line after them
  text = text.replace(/(#{1,3} .+)\n([^\n])/g, '$1\n\n$2');

  // Step 5: Remove any remaining stray backslashes before punctuation
  text = text.replace(/\\([.,،؛:؟!])/g, '$1');

  // Step 6: Post-generation safety cleanup for Arabic football styling
  text = text.replace(/بارسا|بارصا|بارشا|Barca|Barça/g, 'برشلونة');
  
  // Remove any stray isolated Latin letters (like the "ca" artifact)
  text = text.replace(/\s[a-zA-Z]{1,3}\s/g, ' ');

  return text.trim();
}

export interface GeneratedArticle {
  title: string;
  content: string;
  excerpt: string;
  sections: Array<{
    heading: string;
    content: string;
  }>;
  factBox: string;
  sources: Array<{
    url: string;
    title: string;
    credibility: string;
  }>;
  quizData?: {
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: string;
      hint?: string;
    }>;
  };
}

const articleSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: 'SEO-friendly, engaging title',
    },
    excerpt: {
      type: Type.STRING,
      description: '2-3 sentence summary for social media/search',
    },
    content: {
      type: Type.STRING,
      description: 'Full article content in markdown format. For quizzes, explain the game rules.',
    },
    sections: {
      type: Type.ARRAY,
      description: 'Array of sections for the article',
      items: {
        type: Type.OBJECT,
        properties: {
          heading: { type: Type.STRING },
          content: { type: Type.STRING },
        },
        required: ['heading', 'content'],
      },
    },
    factBox: {
      type: Type.STRING,
      description: '5-7 bullet points of key facts',
    },
    sources: {
      type: Type.ARRAY,
      description: 'Array of sources used',
      items: {
        type: Type.OBJECT,
        properties: {
          url: { type: Type.STRING },
          title: { type: Type.STRING },
          credibility: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
        },
        required: ['url', 'title', 'credibility'],
      },
    },
    quizData: {
      type: Type.OBJECT,
      description:
        'ONLY FOR QUIZZES: Structured data for the quiz game. Create at least 12-15 questions for a deep experience.',
      properties: {
        type: {
          type: Type.STRING,
          enum: ['multiple_choice', 'crossword'],
          description: 'The type of game',
        },
        questions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: {
                type: Type.STRING,
                description:
                  "The question text. IMPORTANT: If 'imageUrl' or 'clueLogos' are provided, DO NOT include descriptive spoilers in this text (e.g., stadium names, history). Keep it generic like 'من هو هذا الفريق؟' or 'من هو هذا اللاعب؟'.",
              },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '4 possible answers',
              },
              correctAnswer: { type: Type.STRING, description: 'The correct answer' },
              hint: { 
                type: Type.STRING,
                description: 'A professional hint. For visual quizzes, the hint should NOT be too obvious.'
              },
              imageUrl: {
                type: Type.STRING,
                description:
                  'URL for a logo or a BLURRED/HIDDEN version of the player if they are the subject.',
              },
              clueLogos: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                  'URLs of team logos to show as visual clues (e.g. clubs they played for). USE ONLY REAL URLS.',
              },
            },
            required: ['question', 'options', 'correctAnswer'],
          },
        },
        crossword: {
          type: Type.OBJECT,
          properties: {
            grid: {
              type: Type.ARRAY,
              items: { type: Type.ARRAY, items: { type: Type.STRING } },
              description: '2D grid of letters or null',
            },
            clues: {
              type: Type.OBJECT,
              properties: {
                across: { 
                  type: Type.ARRAY, 
                  items: { 
                    type: Type.OBJECT,
                    properties: {
                      number: { type: Type.NUMBER },
                      clue: { type: Type.STRING },
                      row: { type: Type.NUMBER },
                      col: { type: Type.NUMBER },
                      answer: { type: Type.STRING }
                    },
                    required: ['number', 'clue', 'row', 'col', 'answer']
                  } 
                },
                down: { 
                  type: Type.ARRAY, 
                  items: { 
                    type: Type.OBJECT,
                    properties: {
                      number: { type: Type.NUMBER },
                      clue: { type: Type.STRING },
                      row: { type: Type.NUMBER },
                      col: { type: Type.NUMBER },
                      answer: { type: Type.STRING }
                    },
                    required: ['number', 'clue', 'row', 'col', 'answer']
                  } 
                },
              },
            },
          },
        },
      },
      required: ['type'],
    },
  },
  required: ['title', 'excerpt', 'content', 'sections', 'factBox', 'sources'],
};

export async function generateArticle(
  topic: ExtractedTopic,
  factCheckedData?: string,
  originalSourceText?: string
): Promise<GeneratedArticle> {
  try {
    // 1. Perform DuckDuckGo Search for SUPPLEMENTAL tactical depth only
    const searchQuery =
      topic.searchQueries.length > 0 ? topic.searchQueries[0] : topic.title;
    const rawSearchContext = await duckduckgoSearch(searchQuery);

    const SYSTEM_PROMPT = `You are a legendary football historian and a master tactical analyst for DX7 SPORT. 

MISSION: Write an EXCESSIVELY long, detailed, and epic football article. There is always more to say—dive deep into history, tactical nuances, psychological factors, and future implications.

CRITICAL SOURCE PRIORITY:
- ABSOLUTE PRIMARY SOURCE: The following "ORIGINAL SOURCE TEXT" is your foundation.
  ---
  ${originalSourceText || 'Use the topic summary as your guide.'}
  ---
- SUPPLEMENTAL DATA (Use for tactical depth only):
  * Official Stats: ${factCheckedData || 'N/A'}
  * Live Web Context: ${rawSearchContext}

CRITICAL LANGUAGE & STYLING RULES: 
- SOPHISTICATED FUSHA ARABIC: Use high-level literary Arabic. Avoid simple or repetitive phrasing.
- NO INTRODUCTIONS/CONCLUSIONS: Start with a powerful scene or tactical observation. No "In this article...".
- ARTICLE LENGTH (CRITICAL): You must write at least 2000-2500 words. If you run out of data, expand on the tactical history of the clubs, the specific roles of players, and the global impact of the event.
- FORMATTING (CRITICAL): 
  * TITLE: The 'title' field should be a masterwork of SEO and epic storytelling.
  * HEADINGS: Use ## for main sections and ### for sub-sections. Headings must be clear and professional.
  * BOLDING: Use **bold** ONLY for specific names (players/managers) or key numbers (scores/dates). NEVER bold entire sentences or long lead-ins.
  * NORMAL TEXT: Paragraphs must be long, cohesive, and primarily normal text. No "Bold Lead-ins".
- TACTICAL MASTERY: Describe passing lanes, pressing triggers, and defensive transitions in vivid detail.
- NUMBERS AS WORDS: Write "خمسة" instead of "5" (except for scores like 2-1 and years like 2024).
- NO SLANG: Always use official names like "برشلونة".
- TODAY'S DATE IS ${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}.

CRITICAL EXCLUSION RULE:
- NEVER mention or reference the Israeli league, teams, or players.

QUIZ RULES: 
- LEAGUES: ONLY use Top 5 European leagues + Portuguese + Dutch.
- IMAGE URLS: Mandatory for visual quizzes. Use 'LOGO_URL' from official data.
- NO SPOILERS: If visual, question = 'من هذا؟' or 'خمن الفريق'.
- DEPTH: 15+ questions for every quiz.

Return the result as clean JSON matching the schema.`;

    const prompt = `Write a football article based on this information:

**Topic Analysis:**
- Category: ${topic.category}
- Title: ${topic.title}
- Summary: ${topic.summary}
- Entities: ${topic.entities.join(', ')}
- Key Questions to Address: ${topic.keyQuestions.join(', ')}

**LIVE SEARCH CONTEXT (DuckDuckGo News Snippets from the past week):**
${rawSearchContext ? rawSearchContext : 'No recent news found. Rely on verified knowledge.'}
`;

    const result = await executeWithAI<GeneratedArticle>({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: prompt,
      schema: articleSchema,
    });

    const parsed = result;

    // Defensive type checks
    if (typeof parsed.title !== 'string') parsed.title = String(parsed.title || '');
    if (typeof parsed.content !== 'string') parsed.content = String(parsed.content || '');
    if (typeof parsed.excerpt !== 'string') parsed.excerpt = String(parsed.excerpt || '');

    // Sanitize content
    if (parsed.content) {
      parsed.content = sanitizeArticleContent(parsed.content);
    }
    if (parsed.excerpt) {
      parsed.excerpt = parsed.excerpt.replace(/\\n/g, ' ').replace(/\n+/g, ' ').trim();
    }
    // Sanitize factBox (Handle cases where AI returns an array instead of string)
    if (parsed.factBox) {
      if (Array.isArray(parsed.factBox)) {
        parsed.factBox = (parsed.factBox as string[]).map(item => `• ${item}`).join('\n');
      } else if (typeof parsed.factBox === 'string') {
        parsed.factBox = parsed.factBox.replace(/\\n/g, '\n').trim();
      }
    } else {
      parsed.factBox = '';
    }

    return parsed;
  } catch (error) {
    console.error('Error generating article:', error);
    throw error;
  }
}

export async function regenerateArticle(
  originalContent: string,
  feedback: string
): Promise<string> {
  return executeWithAI<string>({
    systemPrompt: 'Revise this article based on feedback.',
    userPrompt: `Feedback: ${feedback}\n\nContent: ${originalContent}`,
    temperature: 0.7,
  });
}

export async function optimizeForSEO(
  content: string,
  topic: string
): Promise<{
  title: string;
  metaDescription: string;
  keywords: string[];
}> {
  return executeWithAI<{ title: string; metaDescription: string; keywords: string[] }>({
    systemPrompt: 'Optimize this football article for SEO. Return JSON.',
    userPrompt: `Topic: ${topic}\n\nContent: ${content.slice(0, 2000)}`,
    schema: { type: 'object' }, // Simple schema hint for providers
  });
}
