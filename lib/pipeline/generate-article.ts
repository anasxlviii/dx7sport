import { GoogleGenAI, Type, Schema } from '@google/genai';
import type { ExtractedTopic } from './extract-topic';
import { duckduckgoSearch } from './deep-search';

const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY || '' });

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
}

const articleSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "SEO-friendly, engaging title"
    },
    excerpt: {
      type: Type.STRING,
      description: "2-3 sentence summary for social media/search"
    },
    content: {
      type: Type.STRING,
      description: "Full article content in markdown format with ## headings"
    },
    sections: {
      type: Type.ARRAY,
      description: "Array of sections for the article",
      items: {
        type: Type.OBJECT,
        properties: {
          heading: { type: Type.STRING },
          content: { type: Type.STRING }
        },
        required: ["heading", "content"]
      }
    },
    factBox: {
      type: Type.STRING,
      description: "5-7 bullet points of key facts and stats"
    },
    sources: {
      type: Type.ARRAY,
      description: "Array of sources used",
      items: {
        type: Type.OBJECT,
        properties: {
          url: { type: Type.STRING },
          title: { type: Type.STRING },
          credibility: { type: Type.STRING, enum: ["high", "medium", "low"] }
        },
        required: ["url", "title", "credibility"]
      }
    }
  },
  required: ["title", "excerpt", "content", "sections", "factBox", "sources"]
};

export async function generateArticle(
  topic: ExtractedTopic
): Promise<GeneratedArticle> {
  try {
    // 1. Perform DuckDuckGo Search
    const searchQuery = topic.searchQueries.length > 0 ? topic.searchQueries[0] : topic.title;
    const rawSearchContext = await duckduckgoSearch(searchQuery);

    // 2. Build the strict prompt
    const SYSTEM_PROMPT = `You are a professional football journalist for DX7 SPORT. 
TODAY'S DATE IS ${new Date().toLocaleString('en-US')}.

CRITICAL ANTI-HALLUCINATION PROTOCOL:
- Prioritize news from the last 24-48 hours.
- DO NOT return news from 2024 or 2025 unless the topic specifically asks for a historical event.
- Base your report ONLY on the provided context below.
- If the context mentions a transfer or event, treat it as CURRENT news for May 2026.

LANGUAGE AND WRITING RULES:
1. Write the entire article in FUSHA ARABIC (Modern Standard Arabic).
2. ONLY use Western numerals (0-9) for all numbers. Do NOT use Eastern Arabic numerals (٠-٩).
3. Be fully autonomous: write the COMPLETE article content yourself. DO NOT leave placeholders, DO NOT ask the user to fill in blanks, and DO NOT leave sections empty.

Write in a clear, engaging style suitable for football fans.
Keep paragraphs concise (2-3 sentences).
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

    const result = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: articleSchema,
        temperature: 0.4
      }
    });

    const responseText = result.text?.trim() || '{}';
    return JSON.parse(responseText);

  } catch (error) {
    console.error('Error generating article:', error);
    throw error;
  }
}

export async function regenerateArticle(
  originalContent: string,
  feedback: string
): Promise<string> {
  const result = await client.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text: `Revise this article based on feedback: ${feedback}\n\nContent: ${originalContent}` }] }]
  });
  return result.text || '';
}

export async function optimizeForSEO(content: string, topic: string): Promise<{
  title: string;
  metaDescription: string;
  keywords: string[];
}> {
  const result = await client.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text: `Optimize this for SEO: ${content.slice(0, 2000)}` }] }]
  });
  const responseText = result.text?.trim() || '{}';
  const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleanJson);
}
