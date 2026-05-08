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
    <div className="min-h-screen bg-black">
      {/* Article Header */}
      <article className="relative overflow-hidden bg-black border-b border-border-subtle pt-20 pb-12 dxt-hero-pattern">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-lime hover:text-white mb-8 transition-colors"
          >
            العودة للأخبار →
          </Link>

          <div className="flex items-center gap-2 mb-6">
            <span className="w-2 h-2 bg-lime rounded-full shadow-[0_0_8px_rgba(179,212,0,0.8)]" />
            <span className="text-xs font-bold text-lime uppercase tracking-widest">
              {article.category === 'news' ? 'أخبار' : article.category === 'transfer' ? 'انتقالات' : article.category === 'match_report' ? 'تقارير المباريات' : article.category === 'comparison' ? 'مقارنات' : article.category}
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase text-white leading-[1.2] mb-8">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="text-xl text-gray-400 font-medium leading-relaxed mb-8 border-r-2 border-lime pr-6 italic">
              {article.excerpt}
            </p>
          )}

          <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
            <span className="flex items-center gap-2">
              <span className="text-lime">تاريخ النشر:</span>
              {article.publishedAt
                ? new Date(article.publishedAt).toLocaleDateString('ar-EG')
                : new Date(article.createdAt).toLocaleDateString('ar-EG')}
            </span>
          </div>
        </div>
      </article>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="dxt-card p-10">
              {/* Fact Box */}
              {metadata.factBox && (
                <div className="bg-lime/5 border border-lime/20 p-8 mb-12 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-lime/10 rotate-45 translate-x-12 -translate-y-12" />
                  <h3 className="text-xs font-black text-lime uppercase tracking-[0.3em] mb-4">معلومات تكتيكية</h3>
                  <div
                    className="text-gray-300 font-medium leading-relaxed prose prose-invert"
                    dangerouslySetInnerHTML={{ __html: metadata.factBox }}
                  />
                </div>
              )}

              {/* Article Content */}
              <div dir="auto" className="prose prose-invert prose-lg max-w-none prose-headings:uppercase prose-headings:italic prose-headings:font-black prose-headings:tracking-tight prose-a:text-lime hover:prose-a:text-white prose-strong:text-lime">
                <ReactMarkdown>{article.content}</ReactMarkdown>
              </div>
            </div>

            {/* Ad Space */}
            <div className="mt-12 bg-dark-surface border border-border-subtle p-12 text-center group transition-colors hover:border-lime/30">
              <div className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-600 group-hover:text-lime transition-colors">
                مساحة إعلانية
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Sources */}
            {article.sources && article.sources.length > 0 && (
              <div className="dxt-card p-8">
                <h3 className="text-xs font-black text-lime uppercase tracking-[0.3em] mb-6">
                  المصادر الموثوقة ({article.sources.length})
                </h3>
                <div className="space-y-4">
                  {article.sources.map((source: any) => (
                    <div key={source.id} className="group">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-bold uppercase tracking-tight text-white group-hover:text-lime transition-colors line-clamp-2 leading-snug"
                        dir="ltr" // Keeping LTR for URLs or original English titles if any
                      >
                        {source.title}
                      </a>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border ${
                            source.credibility === 'high'
                              ? 'border-lime text-lime'
                              : 'border-gray-700 text-gray-500'
                          }`}
                        >
                          موثوقية {source.credibility === 'high' ? 'عالية' : source.credibility}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sidebar Ad */}
            <div className="bg-dark-surface border border-border-subtle p-8 text-center">
              <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-700">إعلان</div>
            </div>

            {/* Related Links */}
            <div className="dxt-card p-8">
              <h3 className="text-xs font-black text-lime uppercase tracking-[0.3em] mb-6">
                أخبار ذات صلة
              </h3>
              <nav className="flex flex-col gap-4">
                <Link
                  href="/category/news"
                  className="text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-lime transition-all flex items-center justify-between group"
                >
                  أخبار عالمية
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">←</span>
                </Link>
                <Link
                  href="/category/transfer"
                  className="text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-lime transition-all flex items-center justify-between group"
                >
                  أخبار الانتقالات
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">←</span>
                </Link>
                <Link
                  href="/category/comparison"
                  className="text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-lime transition-all flex items-center justify-between group"
                >
                  مقارنات
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">←</span>
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Share Section */}
      <div className="bg-zinc-900 border-t border-border-subtle">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h3 className="font-bold text-white uppercase tracking-widest text-xs mb-4">مشاركة</h3>
          <div className="flex gap-4">
            <span className="text-gray-600">
              شارك عبر فيسبوك، تويتر، أو انسخ الرابط
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
