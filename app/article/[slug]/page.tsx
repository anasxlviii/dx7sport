import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db/db';
import { articles, sources } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import ReactMarkdown from 'react-markdown';

async function getArticle(slug: string) {
  const [article] = await db
    .select()
    .from(articles)
    .where(eq(articles.slug, slug))
    .limit(1);

  if (!article) return null;

  const articleSources = await db
    .select()
    .from(sources)
    .where(eq(sources.articleId, article.id));

  return {
    ...article,
    sources: articleSources,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article || article.status !== 'published') {
    notFound();
  }

  const metadata = article.metadata ? JSON.parse(article.metadata) : {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Article Header */}
      <article className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
          >
            ← Back to Home
          </Link>

          <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full mb-4 capitalize">
            {article.category.replace('_', ' ')}
          </span>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="text-xl text-gray-600 mb-6">{article.excerpt}</p>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>
              Published:{' '}
              {article.publishedAt
                ? new Date(article.publishedAt).toLocaleDateString()
                : new Date(article.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </article>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-8">
              {/* Fact Box */}
              {metadata.factBox && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                  <h3 className="font-semibold text-blue-900 mb-3">Key Facts</h3>
                  <div
                    className="text-blue-800 whitespace-pre-line"
                    dangerouslySetInnerHTML={{ __html: metadata.factBox }}
                  />
                </div>
              )}

              {/* Article Content */}
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown>{article.content}</ReactMarkdown>
              </div>
            </div>

            {/* Ad Space */}
            <div className="mt-8 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-500">Advertisement Space</p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Sources */}
            {article.sources && article.sources.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Sources ({article.sources.length})
                </h3>
                <div className="space-y-3">
                  {article.sources.map((source: any) => (
                    <div key={source.id} className="text-sm">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 line-clamp-2"
                      >
                        {source.title}
                      </a>
                      <span
                        className={`ml-2 px-1.5 py-0.5 text-xs rounded ${
                          source.credibility === 'high'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {source.credibility}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ad Space */}
            <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <p className="text-gray-500 text-sm">Sidebar Ad</p>
            </div>

            {/* Related Links */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                More Articles
              </h3>
              <Link
                href="/category/news"
                className="block text-blue-600 hover:text-blue-800 py-2"
              >
                Latest News →
              </Link>
              <Link
                href="/category/transfer"
                className="block text-blue-600 hover:text-blue-800 py-2"
              >
                Transfer Updates →
              </Link>
              <Link
                href="/category/comparison"
                className="block text-blue-600 hover:text-blue-800 py-2"
              >
                Player Comparisons →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Share Section */}
      <div className="bg-white border-t">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h3 className="font-semibold text-gray-900 mb-4">Share this article</h3>
          <div className="flex gap-4">
            <span className="text-gray-600">
              Share on Facebook, Twitter, or copy the link
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return {
      title: 'Article Not Found',
    };
  }

  return {
    title: article.title,
    description: article.excerpt || article.title,
  };
}
