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
  const featuredArticle = articles.length > 0 ? articles[0] : null;
  const feedArticles = articles.length > 1 ? articles.slice(1) : [];

  return (
    <div className="min-h-screen bg-black" dir="rtl">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-black py-16 dxt-hero-pattern">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 text-center">
          <div className="inline-block px-3 py-1 mb-6 border border-lime text-lime text-xs font-bold uppercase tracking-widest">
            أخبار حصرية وتغطية شاملة
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 italic tracking-tighter uppercase dxt-gradient-text leading-tight">
            ارتقِ بمستوى <br /> متابعتك لكرة القدم
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium">
            تحليلات عميقة، أخبار الانتقالات العاجلة، وتقارير المباريات التكتيكية للمشجع النخبوي.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-sm font-bold text-lime uppercase tracking-widest mb-2">أبرز العناوين</h2>
            <h3 className="text-4xl font-black italic tracking-tight text-white uppercase">آخر المستجدات</h3>
          </div>
          <div className="h-px flex-1 bg-border-subtle mx-8 hidden md:block mb-4" />
        </div>

        {articles.length === 0 ? (
          <div className="dxt-card rounded-none p-16 text-center border-dashed">
            <p className="text-gray-500 uppercase tracking-widest font-bold">
              لا توجد أخبار متاحة حالياً.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Featured Article - Takes up 2 columns on large screens */}
            {featuredArticle && (
              <div className="lg:col-span-2">
                <Link
                  href={`/article/${featuredArticle.slug}`}
                  className="group dxt-card flex flex-col h-full bg-dark-surface border-lime/30 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-lime/5 rotate-45 translate-x-16 -translate-y-16" />
                  <div className="p-10 flex-1 z-10">
                    <div className="flex items-center gap-2 mb-6">
                      <span className="w-3 h-3 bg-lime rounded-full shadow-[0_0_12px_rgba(179,212,0,0.8)] animate-pulse" />
                      <span className="text-xs font-bold text-lime uppercase tracking-widest">
                        الخبر الرئيسي | {featuredArticle.category === 'news' ? 'أخبار' : featuredArticle.category === 'transfer' ? 'انتقالات' : featuredArticle.category === 'match_report' ? 'تقارير المباريات' : featuredArticle.category === 'comparison' ? 'مقارنات' : featuredArticle.category}
                      </span>
                    </div>
                    <h3 className="text-3xl md:text-5xl font-black italic text-white leading-tight mb-6 group-hover:text-lime transition-colors">
                      {featuredArticle.title}
                    </h3>
                    {featuredArticle.excerpt && (
                      <p className="text-gray-300 text-lg font-medium leading-relaxed mb-8 border-r-2 border-lime pr-4">
                        {featuredArticle.excerpt}
                      </p>
                    )}
                  </div>
                  <div className="px-10 py-6 border-t border-border-subtle flex items-center justify-between text-xs font-bold uppercase tracking-widest text-gray-500 z-10">
                    <span>
                      {featuredArticle.publishedAt
                        ? new Date(featuredArticle.publishedAt).toLocaleDateString('ar-EG')
                        : new Date(featuredArticle.createdAt).toLocaleDateString('ar-EG')}
                    </span>
                    <span className="group-hover:text-lime transition-colors text-lime">اقرأ التفاصيل ←</span>
                  </div>
                </Link>
              </div>
            )}

            {/* Sidebar / Secondary Articles */}
            <div className="flex flex-col gap-6">
              {feedArticles.slice(0, 3).map((article) => (
                <ArticleCard key={article.id} article={article} compact={true} />
              ))}
            </div>

          </div>
        )}

        {/* More Articles Grid */}
        {feedArticles.length > 3 && (
          <div className="mt-12 pt-12 border-t border-border-subtle">
            <h3 className="text-2xl font-black italic tracking-tight text-white uppercase mb-8">المزيد من الأخبار</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {feedArticles.slice(3).map((article) => (
                <ArticleCard key={article.id} article={article} compact={false} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Category Links */}
      <section className="bg-dark-surface border-t border-border-subtle py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-sm font-bold text-lime uppercase tracking-widest mb-12 text-center">تصفح الأقسام</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'الأخبار', slug: 'news', desc: 'عناوين عالمية' },
              { name: 'الانتقالات', slug: 'transfer', desc: 'حركة السوق' },
              { name: 'المقارنات', slug: 'comparison', desc: 'تحليل البيانات' },
              { name: 'التقارير', slug: 'match_report', desc: 'تحليل تكتيكي' },
            ].map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="group dxt-card p-8 transition-all hover:bg-black text-center"
              >
                <p className="text-2xl font-black italic text-white uppercase group-hover:text-lime transition-colors">
                  {category.name}
                </p>
                <p className="mt-3 text-xs font-bold text-gray-500 uppercase tracking-widest">
                  {category.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ArticleCard({ article, compact = false }: { article: any, compact?: boolean }) {
  const categoryMap: Record<string, string> = {
    news: 'أخبار',
    transfer: 'انتقالات',
    comparison: 'مقارنات',
    match_report: 'تقارير المباريات'
  };
  
  return (
    <Link
      href={`/article/${article.slug}`}
      className="group dxt-card flex flex-col h-full"
    >
      <div className={`${compact ? 'p-6' : 'p-8'} flex-1`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 bg-lime rounded-full shadow-[0_0_8px_rgba(179,212,0,0.8)]" />
          <span className="text-[10px] font-bold text-lime uppercase tracking-widest">
            {categoryMap[article.category] || article.category}
          </span>
        </div>
        <h3 className={`${compact ? 'text-xl' : 'text-2xl'} font-black italic text-white leading-tight mb-3 group-hover:text-lime transition-colors line-clamp-3`}>
          {article.title}
        </h3>
        {!compact && article.excerpt && (
          <p className="text-gray-400 text-sm font-medium line-clamp-2 mb-4 leading-relaxed">
            {article.excerpt}
          </p>
        )}
      </div>
      <div className={`px-6 py-4 border-t border-border-subtle flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500`}>
        <span>
          {article.publishedAt
            ? new Date(article.publishedAt).toLocaleDateString('ar-EG')
            : new Date(article.createdAt).toLocaleDateString('ar-EG')}
        </span>
        <span className="group-hover:text-lime transition-colors">التفاصيل ←</span>
      </div>
    </Link>
  );
}
