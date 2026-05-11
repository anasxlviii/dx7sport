import { GoogleGenAI, Type, Schema } from '@google/genai';
import type { ExtractedTopic } from './extract-topic';
import { duckduckgoSearch } from './deep-search';
import { executeWithGemini } from './gemini-client';

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

export async function generateArticle(topic: ExtractedTopic): Promise<GeneratedArticle> {
  try {
    // 1. Perform DuckDuckGo Search for live context
    const searchQuery =
      topic.searchQueries.length > 0 ? topic.searchQueries[0] : topic.title;
    const rawSearchContext = await duckduckgoSearch(searchQuery);

    // 2. Build the strict prompt
    const SYSTEM_PROMPT = `You are a professional football journalist and game designer for DX7 SPORT. 
TODAY'S DATE IS ${new Date().toLocaleString('en-US')}.

CRITICAL ANTI-HALLUCINATION PROTOCOL:
- Prioritize news from the last 24-48 hours.
- DO NOT return news from 2024 or 2025 unless the topic specifically asks for a historical event.
- Base your report ONLY on the provided context below.
- If the context mentions a transfer or event, treat it as CURRENT news for May 2026.

LANGUAGE AND WRITING RULES:
1. Write the entire article in FUSHA ARABIC (Modern Standard Arabic).
2. ONLY use Western numerals (0-9) for all numbers. Do NOT use Eastern Arabic numerals (٠-٩).
3. Be fully autonomous: write the COMPLETE article content yourself. DO NOT leave placeholders.
4. ARTICLE LENGTH & DEPTH: The article MUST BE EXTREMELY LONG AND IN-DEPTH. Aim for a minimum of 1200-1500 words. Provide extreme tactical depth, historical context, background stories, and deep analysis to keep readers engaged.
5. VISUAL FORMATTING & STRUCTURE: You MUST use rich Markdown formatting to visually guide the reader:
   - Use \`##\` (H2) and \`###\` (H3) for clear, descriptive section headings.
   - Use \`> \` (blockquotes) for important quotes, statements, or highlighted takeaways.
   - Use bullet points \`* \` for tactical breakdowns, timelines, or lists.
   - Use **bold text** for player names, team names, crucial stats, and key concepts.
   - Keep paragraphs concise (3-4 sentences maximum) but write many paragraphs to achieve the length requirement.
6. SOURCES: Do NOT hallucinate sources. The \`sources\` array must ONLY contain actual URLs that appear in the LIVE SEARCH CONTEXT. If no real URL is provided, omit it or use the source domain only but never fabricate a fake specific article link.

QUIZ & GAME DESIGN RULES:
- If category is 'quiz', the 'quizData' field MUST be populated with AT LEAST 15+ LEVELS.
- Support 'multiple_choice' or 'crossword'.
- NO SPOILERS: If the user has to guess a player/team, DO NOT provide their clear image in imageUrl. Instead, use clueLogos for their transfer history (club logos) or rivals.
- GUESS THE PLAYER: Use the clueLogos array for logos of the clubs they played for (last 5 clubs).
- GUESS THE TEAM: Provide logos of the team's rivals or legendary trophies they won in clueLogos.
- CROSSWORD: Create 10+ variations with a valid 5x5 or 7x7 grid using common Arabic football terms.
- DIFFICULTY: Levels must be progressively harder.
- BRANDING: DX7 Sport.
- NUMERALS: ALWAYS use normal numerals (0-9).
- LANGUAGE: FUSHA ARABIC.
- Ensure the data is up-to-date for May 2026.

Do not use markdown code blocks like \`\`\`json, just return the data matching the schema.`;

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

    const result = await executeWithGemini(async (client: GoogleGenAI) => {
      const res = await client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: articleSchema,
          temperature: 0.4,
        },
      });
      return res;
    });

    const responseText = result.text?.trim() || '{}';
    const parsed = JSON.parse(responseText);

    // Sanitize content
    if (parsed.content) {
      parsed.content = sanitizeArticleContent(parsed.content);
    }
    if (parsed.excerpt) {
      parsed.excerpt = parsed.excerpt.replace(/\\n/g, ' ').replace(/\n+/g, ' ').trim();
    }
    if (parsed.factBox) {
      parsed.factBox = parsed.factBox.replace(/\\n/g, '\n').trim();
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
  const result = await executeWithGemini(async (client: GoogleGenAI) => {
    const res = await client.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Revise this article based on feedback: ${feedback}\n\nContent: ${originalContent}`,
            },
          ],
        },
      ],
    });
    return res;
  });
  return result.text || '';
}

export async function optimizeForSEO(
  content: string,
  topic: string
): Promise<{
  title: string;
  metaDescription: string;
  keywords: string[];
}> {
  const result = await executeWithGemini(async (client: GoogleGenAI) => {
    const res = await client.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `Optimize this for SEO: ${content.slice(0, 2000)}` }],
        },
      ],
    });
    return res;
  });
  const responseText = result.text?.trim() || '{}';
  const cleanJson = responseText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  return JSON.parse(cleanJson);
}
