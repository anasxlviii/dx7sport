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
        'ONLY FOR QUIZZES: Structured data for the quiz game. Create at least 10-15 questions for a deep experience.',
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
                  "The question or clue. For 'Guess the Player', describe their transfer history or achievements.",
              },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '4 possible answers',
              },
              correctAnswer: { type: Type.STRING, description: 'The correct answer' },
              hint: { type: Type.STRING },
              imageUrl: {
                type: Type.STRING,
                description:
                  'URL for a logo or a BLURRED/HIDDEN version of the player if they are the subject.',
              },
              clueLogos: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                  'Optional: URLs of team logos to show as visual clues (e.g. clubs they played for)',
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
                across: { type: Type.ARRAY, items: { type: Type.STRING } },
                down: { type: Type.ARRAY, items: { type: Type.STRING } },
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
  factCheckedData?: string
): Promise<GeneratedArticle> {
  try {
    // 1. Perform DuckDuckGo Search for live context
    const searchQuery =
      topic.searchQueries.length > 0 ? topic.searchQueries[0] : topic.title;
    const rawSearchContext = await duckduckgoSearch(searchQuery);

    // 2. Build the strict prompt
    const SYSTEM_PROMPT = `You are a world-class football tactical analyst and a passionate sports pundit for DX7 SPORT. 

CRITICAL LANGUAGE & STYLING RULES: 
- EVERY WORD YOU OUTPUT MUST BE IN SOPHISTICATED FUSHA ARABIC (Modern Standard Arabic). 
- STALAGMITE RULE: NEVER mix Latin/English letters within Arabic words or sentences. 
- FORBIDDEN TERMS: Never use "بارسا", "بارصا", "بارشا", or "Barca". ALWAYS use "برشلونة".
- TEAM NAMES: Use the full Arabic names for teams (e.g., "ريال مدريد", "مانشستر يونايتد").
- ZERO TOLERANCE for mixing English characters like "ca" or "e" into Arabic words.
- Use Western numerals (0-9).

CRITICAL FACTUAL GROUNDING:
- TODAY'S DATE IS ${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}.
- OFFICIAL VERIFIED DATA (TheSportsDB): 
  ${factCheckedData || 'No specific team data found. Use web context carefully.'}

- USE ONLY SEARCH CONTEXT: For current news, squad lists, and scores, ONLY use the provided "LIVE SEARCH CONTEXT" and "OFFICIAL VERIFIED DATA". 
- DO NOT hallucinate old facts or use internal training data for recent events. 
- If you mention future fixtures or past scores, they MUST match the "OFFICIAL VERIFIED DATA" exactly.

VERBOSITY & ARABIC LINGUISTIC EXCELLENCE:
- This is a PREMIUM MAGAZINE. Articles must be LONG, EPIC, and POETIC.
- Arabic is a rich and expressive language; use its full potential. Avoid simple, school-level sentences.
- Use SOPHISTICATED, FLOWING, and COMPLEX sentence structures.
- NO SCATTERED SENTENCES. Every section must consist of 3-4 LONG, cohesive, and deeply analytical paragraphs.
- Aim for a "Literary Sport Journalism" style (أدب الصحافة الرياضية). Use evocative and powerful vocabulary.

ABSOLUTE SPECIFICITY RULE:
- NEVER be vague. If you mention future challenges, you MUST name the specific opponents, dates, and venues provided in the "OFFICIAL VERIFIED DATA".
- Never say "a difficult match"; say "the upcoming clash against [Team Name] at [Stadium]".
- If a team has a recent result, mention the score exactly (e.g., "الانتصار العريض بنتيجة 3-0").
- INTEGRATE the facts into the narrative flow of the paragraphs. Do not just list them.

CRITICAL PERSONA & TONE:
- You are a SEASONED JOURNALIST and a LITERARY GIANT in the sports world.
- Your writing should inspire, educate, and "WOW" the reader with its depth and beauty.
- Use technical tactical terminology, but wrap it in elegant Arabic prose.
- USE ACTUAL FACTS: Prioritize data from the Search Context. Cite specific recent matches, tactical changes, and verified news. Avoid being "vague". Analyze the "WHY" and "HOW" behind the news.

CRITICAL EXCLUSION RULE:
- NEVER mention or reference the Israeli league, teams, or players.

ARTICLE STRUCTURE & VISUALS (NON-NEGOTIABLE):
1. MANDATORY H2 HEADINGS: Every main section MUST start with a \`## \` heading. This triggers the signature DX7 green vertical line in our UI. Without \`## \`, the article looks broken.
2. BOLD PARAGRAPH TITLES: Start EVERY paragraph with a short **Bold Lead-in** that summarizes the paragraph's point (e.g., **التحول التكتيكي المذهل:** ...).
3. ARTICLE LENGTH: Minimum 1500 words. Go into extreme detail about player stats, historical comparisons, and future implications.
4. LANGUAGE: Sophisticated FUSHA ARABIC (Modern Standard Arabic). Use Western numerals (0-9).
5. FORMATTING: 
   - Use \`## \` for major section breaks.
   - Use \`> \` for intense tactical summaries or pundit "hot takes".
   - Use bold text frequently for emphasis.
   - Use bullet points for squad lists or key tactical instructions.

QUIZ & GAME DESIGN: (Only if category is quiz)
- Create 20+ levels of deep football knowledge.
- NO SPOILERS in the question text.

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
