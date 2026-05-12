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

    // 2. Build the strict prompt
    const SYSTEM_PROMPT = `You are a world-class football tactical analyst and a passionate sports pundit for DX7 SPORT. 

CRITICAL SOURCE PRIORITY:
- ABSOLUTE PRIMARY SOURCE: The following "ORIGINAL SOURCE TEXT" is your foundation.
  ---
  ${originalSourceText || 'Use the topic summary as your guide.'}
  ---
- YOUR MISSION: Translate and paraphrase the information from the ORIGINAL SOURCE TEXT into sophisticated Arabic. 
- Expand on its points, but DO NOT contradict it.
- SUPPLEMENTAL DATA (Use for tactical depth only):
  * Official Stats: ${factCheckedData || 'N/A'}
  * Live Web Context: ${rawSearchContext}

CRITICAL LANGUAGE & STYLING RULES: 
- EVERY WORD YOU OUTPUT MUST BE IN SOPHISTICATED FUSHA ARABIC (Modern Standard Arabic). 
- NO INTRODUCTIONS OR CONCLUSIONS: DO NOT use phrases like "في هذا المقال" (In this article) or "ختاماً" (In conclusion). Start the article directly with a powerful, descriptive opening paragraph.
- NUMBERS AS WORDS: Every single quantity or number MUST be written as an Arabic word.
  * E.g., Write "خمسة أهداف" instead of "5 أهداف".
  * E.g., Write "المركز العاشر" instead of "المركز 10".
  * ABSOLUTE EXCEPTION: Match scores (e.g., 2-1) and specific years (e.g., 2024) MUST be written in Western numerals (0-9).
- SUPERIOR EXPRESSION: Use the full richness of the Arabic language. Avoid redundancy. Use poetic metaphors, epic descriptions, and high-impact vocabulary.
- LONG COHESIVE PARAGRAPHS: Do not write short, scattered sentences. Every section must have 3-4 dense, analytical, and beautifully written paragraphs.
- TACTICAL DEPTH: Analyze formations, transitions, and individual performances like a veteran pundit.
- NO SLANG: Always use "برشلونة" and "ريال مدريد". Use nicknames (e.g., "الملكي") only for poetic emphasis.
- TODAY'S DATE IS ${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}.
- OFFICIAL VERIFIED DATA (TheSportsDB): 
  ${factCheckedData || 'No specific team data found. Use web context carefully.'}

- USE ONLY SEARCH CONTEXT: For current news, squad lists, and scores, ONLY use the provided "LIVE SEARCH CONTEXT" and "OFFICIAL VERIFIED DATA". 
- ABSOLUTE SPECIFICITY: Never be vague. Name the opponents, the venue, and the exact dates provided in the context.

CRITICAL EXCLUSION RULE:
- NEVER mention or reference the Israeli league, teams, or players.

ARTICLE STRUCTURE:
1. MANDATORY H2 HEADINGS: Every main section MUST start with a ## heading. Use descriptive, epic headings (e.g., ## ملحمة المواجهة المنتظرة).
2. BOLD LEAD-INS: Start EVERY paragraph with a **Bold Lead-in** summarizing the tactical or narrative point.
3. ARTICLE LENGTH: Articles must be substantial and detailed. Minimum 1200-1500 words of deep analysis.
4. FACT BOX: The factBox section must contain 5-7 verified, high-impact facts.
5. QUIZ RULES: 
   - LEAGUES: For quizzes, ONLY use teams and players from the English Premier League, Spanish La Liga, Italian Serie A, German Bundesliga, French Ligue 1, Portuguese Primeira Liga, and Dutch Eredivisie.
   - IMAGE URLS: For visual quizzes (Guess the Logo/Player), the 'imageUrl' field is MANDATORY. Strictly use the 'LOGO_URL' provided in the 'OFFICIAL VERIFIED DATA' above. Do not leave it empty.
   - NO SPOILERS: If the quiz is visual (Guess the Player/Logo), the 'question' field MUST NOT contain any descriptive text about the team or player. Keep it short: 'من هذا؟' or 'خمن الفريق'.
   - DEPTH: Provide 12 or more questions for every quiz.
   - VARIETY: Use a mix of famous and slightly challenging teams/players from the specified leagues.

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
