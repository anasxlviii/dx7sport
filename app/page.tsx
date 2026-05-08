import Link from 'next/link';
import { db } from '@/lib/db/db';
import { articles } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

async function getPublishedArticles() {
  const allArticles = await db
    .select()
    .from(articles)
    .where(eq(articles.status, 'published'))
    .orderBy(desc(articles.publishedAt))
    .limit(12);

  return allArticles;
}

export default async function Home() {
  const articles = await getPublishedArticles();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Latest Football News & Analysis
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Stay updated with transfer news, match analysis, player comparisons,
            and more from the world of football.
          </p>
        </div>
      </section>

      {/* Articles Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Latest Articles</h2>

        {articles.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">
              No articles published yet. Check back soon!
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

      {/* Category Links */}
      <section className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'News', slug: 'news', icon: '📰' },
              { name: 'Transfers', slug: 'transfer', icon: '💰' },
              { name: 'Comparisons', slug: 'comparison', icon: '⚖️' },
              { name: 'Match Reports', slug: 'match_report', icon: '🏟️' },
            ].map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="bg-gray-50 hover:bg-gray-100 rounded-lg p-6 text-center transition"
              >
                <span className="text-3xl">{category.icon}</span>
                <p className="mt-2 font-medium text-gray-900">{category.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
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
        <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full mb-3 capitalize">
          {article.category.replace('_', ' ')}
        </span>
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
