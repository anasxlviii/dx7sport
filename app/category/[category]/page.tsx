import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db/db';
import { articles } from '@/lib/db/schema';
import { eq, desc, like } from 'drizzle-orm';

const CATEGORIES = {
  news: 'News',
  comparison: 'Comparisons',
  poll: 'Polls',
  match_report: 'Match Reports',
  transfer: 'Transfer News',
};

async function getArticlesByCategory(category: string) {
  const allArticles = await db
    .select()
    .from(articles)
    .where(eq(articles.status, 'published'))
    .orderBy(desc(articles.publishedAt));

  // Filter by category
  const filtered = allArticles.filter(a => a.category === category);

  return filtered;
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const articles = await getArticlesByCategory(category);

  const categoryTitle = CATEGORIES[category as keyof typeof CATEGORIES];

  if (!categoryTitle) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Category Header */}
      <section className="bg-gradient-to-b from-blue-600 to-blue-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center text-blue-100 hover:text-white mb-4"
          >
            ← Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold">{categoryTitle}</h1>
        </div>
      </section>

      {/* Articles */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {articles.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">
              No articles in this category yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ArticleCard({ article }: { article: any }) {
  return (
    <Link
      href={`/article/${article.slug}`}
      className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
    >
      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-gray-600 text-sm line-clamp-3 mb-4">
            {article.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {article.publishedAt
              ? new Date(article.publishedAt).toLocaleDateString()
              : new Date(article.createdAt).toLocaleDateString()}
          </span>
          <span>Read more →</span>
        </div>
      </div>
    </Link>
  );
}
