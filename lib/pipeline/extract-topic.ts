import { GoogleGenAI, Type, Schema } from '@google/genai';
import { executeWithGemini } from './gemini-client';

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
- NEVER extract, mention, or reference anything related to the Israeli league, Israeli teams, or Israeli players. If the input context contains such information, strictly ignore those parts or the entire topic.

Analyze the given input (text, URL, or image) and extract structured information about the football news it represents.
If an image is provided, identify the players, teams, or match event depicted and use it to define the topic.
Always interpret "this season" or "next month" relative to the current date.`;

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

    const result = await executeWithGemini(async (client: GoogleGenAI) => {
      const model = client.models;
      const res = await model.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: topicSchema,
          temperature: 0.2,
        },
      });
      return res;
    });

    const responseText = result.text?.trim() || '{}';
    const parsed = JSON.parse(responseText);

    return {
      category: parsed.category,
      title: parsed.title,
      entities: parsed.entities || [],
      keyQuestions: parsed.keyQuestions || [],
      searchQueries: parsed.searchQueries || [],
      summary: parsed.summary || '',
    };
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
