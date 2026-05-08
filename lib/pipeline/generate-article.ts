import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ExtractedTopic } from './extract-topic';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

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

const SYSTEM_PROMPT = `You are a professional football journalist. Write engaging, well-researched articles.

Guidelines:
- Write in a clear, engaging style suitable for football fans
- Include verified facts and statistics from your knowledge
- Structure articles with clear headings and sections
- Use your training knowledge for facts (you're up to date as of April 2025)
- Avoid speculation unless clearly labeled as such
- Include a "Key Facts" box with important statistics
- Write for an audience of passionate football fans
- Keep paragraphs concise (2-3 sentences)
- Use subheadings to break up longer content

Return ONLY valid JSON in this exact format:
{
  "title": "SEO-friendly, engaging title",
  "excerpt": "2-3 sentence summary for social media/search",
  "content": "Full article content in markdown format with ## headings",
  "sections": [
    {"heading": "Section heading", "content": "Section content"}
  ],
  "factBox": "5-7 bullet points of key facts and stats",
  "sources": []
}`;

export async function generateArticle(
  topic: ExtractedTopic
): Promise<GeneratedArticle> {
  try {
    const prompt = `Write a football article based on this information:

**Topic Analysis:**
- Category: ${topic.category}
- Title: ${topic.title}
- Summary: ${topic.summary}
- Entities: ${topic.entities.join(', ')}
- Key Questions to Address: ${topic.keyQuestions.join(', ')}

**Instructions:**
Use your internal knowledge to write a comprehensive, factual article. Include recent stats, transfers, and relevant information you know.

**Facebook Post Context:**
This will be converted from a Facebook post, so make it comprehensive and well-structured.

Requirements:
1. Write a compelling headline that captures attention
2. Start with a strong lead paragraph
3. Address the key questions mentioned above
4. Include relevant facts and statistics from your knowledge
5. End with a conclusion or question to engage readers
6. Format as markdown with proper headings`;

    const result = await model.generateContent([SYSTEM_PROMPT, prompt]);
    const response = result.response.text().trim();

    // Clean and parse JSON
    const cleanJson = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(cleanJson);

    return {
      title: parsed.title,
      excerpt: parsed.excerpt,
      content: parsed.content,
      sections: parsed.sections || [],
      factBox: parsed.factBox,
      sources: parsed.sources || [],
    };
  } catch (error) {
    console.error('Error generating article:', error);
    throw error;
  }
}

export async function regenerateArticle(
  originalContent: string,
  feedback: string
): Promise<string> {
  const prompt = `Revise this football article based on the feedback:

**Original Article:**
${originalContent}

**Feedback for Revision:**
${feedback}

Return ONLY the revised article content in markdown format.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function optimizeForSEO(content: string, topic: string): Promise<{
  title: string;
  metaDescription: string;
  keywords: string[];
}> {
  const prompt = `Analyze this football article and provide SEO optimization:

**Article Topic:** ${topic}
**Content:** ${content.slice(0, 2000)}

Return JSON with:
{
  "title": "SEO-optimized title (50-60 characters)",
  "metaDescription": "Meta description (150-160 characters)",
  "keywords": ["array of 5-10 relevant keywords"]
}`;

  const result = await model.generateContent(prompt);
  const response = result.response.text().trim();
  const cleanJson = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  return JSON.parse(cleanJson);
}
