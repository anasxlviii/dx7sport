import { extractTopic, type ExtractedTopic } from './extract-topic';
import { scrapeUrl } from './scraper';
import { generateArticle, type GeneratedArticle } from './generate-article';
import { db } from '../db/db';
import { articles, sources } from '../db/schema';
import slugify from 'slugify';

export interface PipelineInput {
  postContent?: string;
  postUrl?: string;
}

export interface PipelineResult {
  success: boolean;
  article?: {
    id: number;
    title: string;
    slug: string;
    status: string;
  };
  error?: string;
  steps: PipelineStep[];
}

export interface PipelineStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export async function runPipeline(input: PipelineInput): Promise<PipelineResult> {
  const steps: PipelineStep[] = [
    { name: 'Scrape URL (if provided)', status: 'pending' },
    { name: 'Extract Topic', status: 'pending' },
    { name: 'Generate Article (with Live Grounding)', status: 'pending' },
    { name: 'Save to Database', status: 'pending' },
  ];

  try {
    let actualContent = input.postContent || '';
    let scrapedData: any = null;

    // Step 1: Scrape URL if provided
    steps[0].status = 'running';
    steps[0].startedAt = new Date();

    if (input.postUrl && input.postUrl.trim()) {
      try {
        scrapedData = await scrapeUrl(input.postUrl);
        if (scrapedData && scrapedData.text) {
          actualContent = actualContent ? `${actualContent}\n\n[Scraped Context]: ${scrapedData.text}` : scrapedData.text;
          steps[0].status = 'completed';
          steps[0].result = { scraped: true, title: scrapedData.title, image: scrapedData.images?.[0] };
        } else {
          steps[0].status = 'completed';
          steps[0].result = { scraped: false, message: 'Could not scrape, using provided content' };
        }
        steps[0].completedAt = new Date();
      } catch (error) {
        steps[0].status = 'completed';
        steps[0].result = { scraped: false, message: 'Scraping failed, using provided content' };
        steps[0].completedAt = new Date();
      }
    } else {
      steps[0].status = 'completed';
      steps[0].result = { message: 'No URL provided' };
      steps[0].completedAt = new Date();
    }

    // Step 2: Extract Topic
    steps[1].status = 'running';
    steps[1].startedAt = new Date();

    let topic: ExtractedTopic;
    try {
      if (!actualContent.trim()) {
        throw new Error("No content to process. Please provide text or a valid URL.");
      }
      topic = await extractTopic(actualContent);
      steps[1].status = 'completed';
      steps[1].result = topic;
      steps[1].completedAt = new Date();
    } catch (error) {
      steps[1].status = 'failed';
      steps[1].error = String(error);
      throw error;
    }

    // Step 3: Generate Article with Live Grounding
    steps[2].status = 'running';
    steps[2].startedAt = new Date();

    let generated: GeneratedArticle;
    try {
      // We no longer pass factChecks because generateArticle uses built-in Google Search grounding
      generated = await generateArticle(topic);
      steps[2].status = 'completed';
      steps[2].result = { title: generated.title };
      steps[2].completedAt = new Date();
    } catch (error) {
      steps[2].status = 'failed';
      steps[2].error = String(error);
      throw error;
    }

    // Step 4: Save to Database
    steps[3].status = 'running';
    steps[3].startedAt = new Date();

    try {
      let slug = slugify(generated.title, { lower: true, strict: true });
      let uniqueSlug = `${slug}-${Date.now().toString().slice(-4)}`;

      const [article] = await db
        .insert(articles)
        .values({
          title: generated.title,
          slug: uniqueSlug,
          content: generated.content,
          excerpt: generated.excerpt,
          status: 'draft',
          category: topic.category,
          sourcePostUrl: input.postUrl,
          sourcePostText: actualContent,
          featuredImage: scrapedData?.images?.[0] || null,
          metadata: JSON.stringify({
            factBox: generated.factBox,
            sections: generated.sections,
          }),
        })
        .returning();

      if (generated.sources && generated.sources.length > 0) {
        await db.insert(sources).values(
          generated.sources.map(source => {
            let cred = source.credibility ? source.credibility.toLowerCase() : 'medium';
            if (!['high', 'medium', 'low'].includes(cred)) {
              cred = 'medium';
            }
            return {
              articleId: article.id,
              url: source.url,
              title: source.title,
              credibility: cred,
            };
          })
        );
      }

      steps[3].status = 'completed';
      steps[3].result = { articleId: article.id };
      steps[3].completedAt = new Date();

      return {
        success: true,
        article: {
          id: article.id,
          title: article.title,
          slug: article.slug,
          status: article.status,
        },
        steps,
      };
    } catch (error) {
      steps[3].status = 'failed';
      steps[3].error = String(error);
      throw error;
    }
  } catch (error) {
    console.error('Pipeline error:', error);
    return {
      success: false,
      error: String(error),
      steps,
    };
  }
}

export async function validateApiKey(): Promise<boolean> {
  try {
    const result = await extractTopic('test');
    return true;
  } catch {
    return false;
  }
}
