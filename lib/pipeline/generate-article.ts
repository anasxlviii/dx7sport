import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ExtractedTopic } from './extract-topic';
import type { FactCheckResult } from './deep-search';

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
- Include verified facts and statistics
- Structure articles with clear headings and sections
- Always cite sources when making factual claims
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
  "sources": [{"url": "source url", "title": "source title", "credibility": "high|medium|low"}]
}`;

export async function generateArticle(
  topic: ExtractedTopic,
  factChecks: FactCheckResult[]
): Promise<GeneratedArticle> {
  try {
    // Prepare source context
    const sourceContext = factChecks
      .map(fc =>
        fc.results
          .slice(0, 3)
          .map(r => `- ${r.title}: ${r.snippet}`)
          .join('\n')
      )
      .join('\n\n');

    // Prepare verified facts
    const verifiedFacts = factChecks
      .map(fc => fc.verifiedFacts)
      .flat()
      .join('\n');

    const prompt = `Write a football article based on this information:

**Topic Analysis:**
- Category: ${topic.category}
- Title: ${topic.title}
- Summary: ${topic.summary}
- Entities: ${topic.entities.join(', ')}
- Key Questions to Address: ${topic.keyQuestions.join(', ')}

**Verified Facts from Research:**
${verifiedFacts || 'No specific facts provided - use general knowledge'}

**Source Context:**
${sourceContext || 'Use general football knowledge'}

**Facebook Post Context:**
This will be converted from a Facebook post, so make it comprehensive and well-structured.

Requirements:
1. Write a compelling headline that captures attention
2. Start with a strong lead paragraph
3. Address the key questions mentioned above
4. Include relevant facts and statistics
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

    // Collect unique sources from fact checks
    const sources = factChecks
      .flatMap(fc => fc.results)
      .filter((r, i, arr) => arr.findIndex(s => s.url === r.url) === i)
      .slice(0, 10)
      .map(r => ({
        url: r.url,
        title: r.title,
        credibility: r.credibility,
      }));

    return {
      title: parsed.title,
      excerpt: parsed.excerpt,
      content: parsed.content,
      sections: parsed.sections || [],
      factBox: parsed.factBox,
      sources,
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
