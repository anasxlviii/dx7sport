import Link from 'next/link';
import { db } from '@/lib/db/db';
import { articles as articlesTable, settings, transfers as transfersTable } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { ArticleCard } from '@/components/ArticleCard';
import { TransferCard } from '@/components/TransferCard';
import { FeedFilter } from '@/components/FeedFilter';
import { ScoreSection } from '@/components/ScoreSection';
import { HeroSlideshow } from '@/components/HeroSlideshow';
import { getTopLeaguesScores } from '@/lib/pipeline/sportsdb';
import { AdScriptInjector } from '@/components/AdScriptInjector';


export const revalidate = 300;

const DATA_TIMEOUT = 15000;

async function getData() {
  if (!db) return { allArticles: [], settingsMap: {}, scores: [], latestTransfers: [] };
  for (let i = 0; i < 3; i++) {
    try {
      const result = await Promise.race([
        Promise.all([
          db.select({ id: articlesTable.id, title: articlesTable.title, slug: articlesTable.slug, excerpt: articlesTable.excerpt, featuredImage: articlesTable.featuredImage, category: articlesTable.category, status: articlesTable.status, publishedAt: articlesTable.publishedAt, createdAt: articlesTable.createdAt }).from(articlesTable).where(eq(articlesTable.status, 'published')).orderBy(desc(articlesTable.id)).limit(40),
          db.select().from(settings),
          getTopLeaguesScores(),
          db.select().from(transfersTable).orderBy(desc(transfersTable.createdAt)).limit(6),
        ]),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Homepage data fetch timed out')), DATA_TIMEOUT))
      ]);
      const [allArticles, allSettings, scores, latestTransfers] = result;

      const settingsMap: Record<string, string> = {};
      allSettings.forEach(s => settingsMap[s.key] = s.value || '');

      return { allArticles, settingsMap, scores, latestTransfers };
    } catch (err) {
      console.error(`[Homepage] Fetch error (attempt ${i + 1}/3):`, err);
      if (i === 2) return { allArticles: [], settingsMap: {}, scores: [], latestTransfers: [] };
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return { allArticles: [], settingsMap: {}, scores: [], latestTransfers: [] };
}

function featuredImg(article: { id: number; featuredImage: string | null }): string | null {
  if (!article.featuredImage) return null;
  if (article.featuredImage.startsWith('http')) return article.featuredImage;
  if (article.featuredImage.startsWith('data:')) return `/api/featured-image/${article.id}`;
  return null;
}

function sanitizeArticles(articles: any[]) {
  return articles.map(a => ({
    ...a,
    featuredImage: a.featuredImage?.startsWith('data:') ? null : a.featuredImage,
  }));
}

export default async function Home() {
  const { allArticles: rawArticles, settingsMap, scores, latestTransfers } = await getData();
  const allArticles = sanitizeArticles(rawArticles);

  const featuredArticle = allArticles.length > 0 ? allArticles[0] : null;
  const sidebarArticles = allArticles.slice(1, 4);
  const feedArticles = allArticles.slice(4);

  const homeBanner = settingsMap['ad_homepage_banner'];
  const homeBannerEnabled = settingsMap['ad_homepage_banner_enabled'] === 'true';

  return (
    <div className="min-h-screen bg-black" dir="rtl">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-black min-h-[80vh] flex items-center justify-center py-32 dxt-hero-pattern">
        <HeroSlideshow />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 text-center">
          <div className="flex flex-col items-center mb-8">
            <div className="inline-block px-4 py-1.5 border border-lime/50 text-lime text-[10px] font-black uppercase tracking-[0.4em] bg-lime/10 backdrop-blur-sm">
              أخبار حصرية وتغطية شاملة
            </div>
          </div>
          <h1 className="text-6xl md:text-9xl font-black mb-12 italic uppercase dxt-gradient-text leading-[1.2] py-4">
            ارتقِ بمستوى <br /> متابعتك للكرة
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto font-medium leading-[1.8] mb-12 drop-shadow-lg">
            تحليلات تكتيكية عميقة، أخبار الانتقالات العاجلة، <br className="hidden md:block" /> وتقارير حصرية للمشجع النخبوي.
          </p>
          <div className="flex justify-center gap-6">
            <Link href="/category/news" className="bg-lime text-black px-10 py-5 font-black uppercase tracking-widest text-xs hover:bg-white transition-all transform hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(163,255,0,0.4)]">
              آخر الأخبار
            </Link>
            <Link href="/category/transfer" className="border-2 border-white/10 bg-black/40 backdrop-blur-md text-white px-10 py-5 font-black uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-all transform hover:-translate-y-1">
              سوق الانتقالات
            </Link>
          </div>
        </div>
      </section>


      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-end justify-between mb-12">
          <div className="flex flex-col items-start mb-3">
            <h2 className="text-xs font-black text-lime uppercase tracking-[0.4em]">أبرز العناوين</h2>
          </div>
          <h3 className="text-5xl font-black italic text-white uppercase leading-tight py-2">آخر المستجدات</h3>

          <div className="h-px flex-1 bg-zinc-900 mx-10 hidden md:block mb-3" />
        </div>

        {allArticles.length === 0 ? (
          <div className="border border-zinc-900 bg-zinc-950/50 p-24 text-center">
            <p className="text-gray-600 uppercase tracking-[0.3em] font-black text-xs">لا توجد أخبار متاحة حالياً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Featured Article */}
            {featuredArticle && (
              <div className="lg:col-span-2">
                <Link
                  href={`/article/${featuredArticle.slug}`}
                  className="group dxt-card flex flex-col h-full bg-zinc-950 border-zinc-900 relative overflow-hidden"
                  style={{ minHeight: '500px' }}
                >
                  <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent z-10" />
                    <img
                      src={featuredImg(featuredArticle) || '/hero/default_card.png'}
                      alt={featuredArticle.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                    />
                  </div>
                  <div className="p-12 flex-1 z-20 flex flex-col justify-end max-w-3xl">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="w-2.5 h-2.5 bg-lime rounded-full shadow-[0_0_15px_rgba(179,212,0,0.9)] animate-pulse" />
                      <span className="text-[10px] font-black text-lime uppercase tracking-[0.3em]">
                        الخبر الرئيسي | {featuredArticle.category === 'news' ? 'أخبار' : featuredArticle.category === 'transfer' ? 'انتقالات' : featuredArticle.category === 'match_report' ? 'تقارير' : featuredArticle.category === 'comparison' ? 'مقارنات' : featuredArticle.category}
                      </span>
                    </div>
                    <h3 className="text-4xl md:text-6xl font-black italic text-white leading-[1.3] mb-8 group-hover:text-lime transition-colors py-2">
                      {featuredArticle.title}
                    </h3>
                    {featuredArticle.excerpt && (
                      <p className="text-gray-300 text-lg md:text-xl font-medium leading-[1.8] mb-10 line-clamp-2 border-r-4 border-lime pr-6">
                        {featuredArticle.excerpt}
                      </p>
                    )}
                  </div>
                  <div className="px-12 py-8 border-t border-zinc-900/50 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.3em] text-gray-500 z-20 bg-black/40 backdrop-blur-md">
                    <span>
                      {featuredArticle.publishedAt
                        ? new Date(featuredArticle.publishedAt).toLocaleDateString('ar-EG', { numberingSystem: 'latn' })
                        : new Date(featuredArticle.createdAt).toLocaleDateString('ar-EG', { numberingSystem: 'latn' })}
                    </span>
                    <span className="text-lime group-hover:translate-x-[-10px] transition-transform">اقرأ القصة الكاملة ←</span>
                  </div>
                </Link>
              </div>
            )}

            {/* Sidebar */}
            <div className="flex flex-col gap-8">
              {sidebarArticles.map((article) => (
                <ArticleCard key={article.id} article={article} compact={true} />
              ))}
            </div>
          </div>
        )}

        {/* Homepage Banner Ad */}
        {homeBannerEnabled && homeBanner && (
          <div className="my-20 flex flex-col items-center">
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-zinc-800 mb-4">إعلان</p>
            <div className="w-full max-w-5xl flex justify-center min-h-[90px]">
              <AdScriptInjector code={homeBanner} />
            </div>
          </div>
        )}

        {/* Entertainment Promo Section */}
        <section className="mt-32 relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-r from-lime/20 to-transparent z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
           <div className="bg-zinc-950 border border-zinc-900 p-12 md:p-20 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="max-w-2xl text-center md:text-right">
                 <div className="flex flex-col items-center md:items-start mb-4">
                    <h2 className="text-xs font-black text-lime uppercase tracking-[0.6em]">DX7 ARCADE</h2>
                 </div>
                 <h3 className="text-5xl md:text-7xl font-black italic text-white uppercase mb-6 leading-tight py-2">
                    ساحة <span className="text-lime">الألعاب</span> والتحديات
                 </h3>
                 <p className="text-gray-500 text-lg font-medium leading-relaxed">
                    اختبر معلوماتك الكروية في تحديات حصرية. خمن اللاعبين، حل الكلمات المتقاطعة، وتصدر قائمة الخبراء.
                 </p>
              </div>
              <Link 
                 href="/entertainment"
                 className="px-16 py-6 bg-lime text-black font-black uppercase tracking-[0.5em] text-sm hover:bg-white hover:shadow-[0_0_50px_rgba(179,212,0,0.4)] transition-all active:scale-95 animate-pulse"
              >
                 العب الآن
              </Link>
           </div>
        </section>

        {/* Latest News Feed */}
        {feedArticles.length > 0 && (
          <div className="mt-24">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-4xl font-black italic text-white uppercase flex items-center gap-4 py-2">
                  <span className="w-12 h-1 bg-lime shadow-[0_0_15px_rgba(179,212,0,0.5)]" />
                  آخر الأخبار العالمية
                </h2>
                <p className="text-gray-500 text-xs font-black uppercase tracking-[0.3em] mt-4 mr-16">تغطية شاملة لكل ما يحدث في عالم كرة القدم</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {feedArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Category Grid Section */}
      <section className="bg-zinc-950 border-y border-zinc-900 py-32 mt-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none dxt-hero-pattern" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-xs font-black text-lime uppercase tracking-[0.5em] mb-4">الأقسام الرئيسية</h2>
            <p className="text-3xl font-black italic text-white uppercase py-2">تغطية شاملة لكل زوايا اللعبة</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: 'الأخبار', slug: 'news', desc: 'عناوين عالمية مباشرة', color: 'lime' },
              { name: 'الانتقالات', slug: 'transfer', desc: 'أسرار سوق اللاعبين', color: 'lime' },
              { name: 'المقارنات', slug: 'comparison', desc: 'لغة الأرقام والبيانات', color: 'lime' },
              { name: 'التقارير', slug: 'match_report', desc: 'تشريح تكتيكي معمق', color: 'lime' },
            ].map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="group border border-zinc-900 bg-black p-10 transition-all hover:border-lime/40 hover:-translate-y-2"
              >
                <div className="w-12 h-1 mb-8 bg-zinc-800 group-hover:bg-lime transition-colors" />
                <p className="text-2xl font-black italic text-white uppercase group-hover:text-lime transition-colors mb-3 py-1">
                  {category.name}
                </p>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                  {category.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Transfers Section */}
      {latestTransfers.length > 0 && (
        <section className="py-32 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-4xl font-black italic text-white uppercase flex items-center gap-4 py-2">
                  <span className="w-12 h-1 bg-lime shadow-[0_0_15px_rgba(179,212,0,0.5)]" />
                  سوق الانتقالات
                </h2>
                <p className="text-gray-500 text-xs font-black uppercase tracking-[0.3em] mt-4 mr-16">آخر الصفقات والشائعات</p>
              </div>
              <Link
                href="/category/transfer"
                className="text-[10px] font-black text-lime uppercase tracking-[0.3em] hover:text-white transition-colors flex-shrink-0"
              >
                عرض الكل ←
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {latestTransfers.map((t) => (
                <TransferCard key={t.id} transfer={t} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Live Scores Section */}
      <ScoreSection scores={scores} />
    </div>
  );
}
