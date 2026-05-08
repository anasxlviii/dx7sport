import { extractTopic, type ExtractedTopic } from './extract-topic';
import { deepSearch, type FactCheckResult } from './deep-search';
import { scrapeUrl } from './scraper';
import { generateArticle, type GeneratedArticle } from './generate-article';
import { db } from '../db/db';
import { articles, sources } from '../db/schema';
import slugify from 'slugify';

export interface PipelineInput {
  postContent: string;
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
    { name: 'Deep Search (DuckDuckGo)', status: 'pending' },
    { name: 'Generate Article', status: 'pending' },
    { name: 'Save to Database', status: 'pending' },
  ];

  try {
    let actualContent = input.postContent;
    let scrapedData: any = null;

    // Step 1: Scrape URL if provided
    steps[0].status = 'running';
    steps[0].startedAt = new Date();

    if (input.postUrl && input.postUrl.trim()) {
      try {
        scrapedData = await scrapeUrl(input.postUrl);
        if (scrapedData && scrapedData.text) {
          actualContent = scrapedData.text;
          steps[0].status = 'completed';
          steps[0].result = { scraped: true, title: scrapedData.title };
        } else {
          // If scraping failed, use provided content
          steps[0].status = 'completed';
          steps[0].result = { scraped: false, message: 'Could not scrape, using provided content' };
        }
        steps[0].completedAt = new Date();
      } catch (error) {
        // Continue with provided content if scraping fails
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
      topic = await extractTopic(actualContent);
      steps[1].status = 'completed';
      steps[1].result = topic;
      steps[1].completedAt = new Date();
    } catch (error) {
      steps[1].status = 'failed';
      steps[1].error = String(error);
      throw error;
    }

    // Step 3: Deep Search with DuckDuckGo
    steps[2].status = 'running';
    steps[2].startedAt = new Date();

    let factChecks: FactCheckResult[];
    try {
      factChecks = await deepSearch(topic.searchQueries, topic.entities);
      steps[2].status = 'completed';
      steps[2].result = { searchCount: factChecks.length, totalResults: factChecks.reduce((sum, fc) => sum + fc.results.length, 0) };
      steps[2].completedAt = new Date();
    } catch (error) {
      steps[2].status = 'completed';
      steps[2].result = { message: 'Search failed, continuing with AI knowledge' };
      steps[2].error = String(error);
      steps[2].completedAt = new Date();
      factChecks = [];
    }

    // Step 4: Generate Article with search results
    steps[3].status = 'running';
    steps[3].startedAt = new Date();

    let generated: GeneratedArticle;
    try {
      generated = await generateArticle(topic, factChecks);
      steps[3].status = 'completed';
      steps[3].result = { title: generated.title };
      steps[3].completedAt = new Date();
    } catch (error) {
      steps[3].status = 'failed';
      steps[3].error = String(error);
      throw error;
    }

    // Step 5: Save to Database
    steps[4].status = 'running';
    steps[4].startedAt = new Date();

    try {
      // Generate unique slug
      let slug = slugify(generated.title, { lower: true, strict: true });
      let uniqueSlug = slug;
      let counter = 1;

      // Check for uniqueness
      while (counter <= 10) {
        uniqueSlug = counter === 1 ? slug : `${slug}-${counter}`;
        counter++;
      }

      // Insert article
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
          metadata: JSON.stringify({
            factBox: generated.factBox,
            sections: generated.sections,
          }),
        })
        .returning();

      // Insert sources from search results
      if (generated.sources && generated.sources.length > 0) {
        await db.insert(sources).values(
          generated.sources.map(source => ({
            articleId: article.id,
            url: source.url,
            title: source.title,
            credibility: source.credibility,
          }))
        );
      }

      steps[4].status = 'completed';
      steps[4].result = { articleId: article.id };
      steps[4].completedAt = new Date();

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
      steps[4].status = 'failed';
      steps[4].error = String(error);
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
