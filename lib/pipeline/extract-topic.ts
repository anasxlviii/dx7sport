import { GoogleGenAI, Type, Schema } from '@google/genai';

const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY || '' });

export interface ExtractedTopic {
  category: 'news' | 'comparison' | 'poll' | 'match_report' | 'transfer';
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
      description: "news | comparison | poll | match_report | transfer"
    },
    title: {
      type: Type.STRING,
      description: "Brief, catchy title for an article"
    },
    entities: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "list of player names, team names, leagues mentioned"
    },
    keyQuestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "list of questions this post addresses that fans want answered"
    },
    searchQueries: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-5 specific search queries to fact-check and expand on this topic"
    },
    summary: {
      type: Type.STRING,
      description: "1-2 sentence summary of what the post is about"
    }
  },
  required: ["category", "title", "entities", "keyQuestions", "searchQueries", "summary"]
};

export async function extractTopic(postContent: string): Promise<ExtractedTopic> {
  try {
    const SYSTEM_PROMPT = `You are a football content expert for DX7 SPORT. 
TODAY'S DATE IS ${new Date().toLocaleString('en-US')}.

Analyze the given Facebook post and extract structured information.
Always interpret "this season" or "next month" relative to the current date.`;

    const result = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\nFacebook post content:\n${postContent}` }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: topicSchema,
        temperature: 0.2
      }
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
