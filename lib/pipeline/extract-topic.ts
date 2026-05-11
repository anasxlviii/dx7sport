import { GoogleGenAI, Type, Schema } from '@google/genai';
import { executeWithAI, executeWithGemini } from './ai-client';

export interface ExtractedTopic {
  category: 'news' | 'comparison' | 'poll' | 'match_report' | 'transfer' | 'quiz';
  title: string;
  entities: string[];
  keyQuestions: string[];
  searchQueries: string[];
  summary: string;
}

const topicSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    category: {
      type: Type.STRING,
      description: 'news | comparison | poll | match_report | transfer | quiz',
    },
    title: {
      type: Type.STRING,
      description: 'Brief, catchy title for an article',
    },
    entities: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'list of player names, team names, leagues mentioned',
    },
    keyQuestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'list of questions this post addresses that fans want answered',
    },
    searchQueries: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '3-5 specific search queries to fact-check and expand on this topic',
    },
    summary: {
      type: Type.STRING,
      description: '1-2 sentence summary of what the post is about',
    },
  },
  required: ['category', 'title', 'entities', 'keyQuestions', 'searchQueries', 'summary'],
};

export async function extractTopic(
  postContent: string,
  imageBase64?: string
): Promise<ExtractedTopic> {
  try {
    const SYSTEM_PROMPT = `You are a football content expert for DX7 SPORT. 
TODAY'S DATE IS ${new Date().toLocaleString('en-US')}.

CRITICAL EXCLUSION RULE:
- NEVER extract, mention, or reference anything related to the Israeli league, Israeli teams, or Israeli players. 

CRITICAL LANGUAGE RULE:
- ALL text fields in your response (title, summary, keyQuestions) MUST be in SOPHISTICATED FUSHA ARABIC (Modern Standard Arabic).
- searchQueries MUST be in ENGLISH to optimize for web searching.
- Use Western numerals (0-9).

Analyze the given input (text, URL, or image) and extract structured information about the football news it represents.
IF THE INPUT IS A BARE URL: Use the information in the URL slug and your internal knowledge of CURRENT real-world events to identify the topic. 
IF THE INPUT IS AN IMAGE: Identify the players, teams, or match event depicted and use it to define the topic.`;

    const parts: any[] = [
      {
        text: `${SYSTEM_PROMPT}\n\nInput Context:\n${
          postContent || 'Analyze the provided image for football news.'
        }`,
      },
    ];

    if (imageBase64) {
      const data = imageBase64.split(',')[1] || imageBase64;
      const mimeType = imageBase64.split(';')[0].split(':')[1] || 'image/jpeg';
      parts.push({ inlineData: { data, mimeType } });
    }

    const result = await executeWithAI<ExtractedTopic>({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: `Analyze this input and extract the football topic: ${postContent || 'Image provided.'}`,
      schema: topicSchema,
      temperature: 0.2,
    });

    return result;
  } catch (error) {
    console.error('Error extracting topic:', error);
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
