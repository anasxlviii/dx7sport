import Link from 'next/link';
import { db } from '@/lib/db/db';
import { articles as articlesTable, settings } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { ArticleCard } from '@/components/ArticleCard';
import { FeedFilter } from '@/components/FeedFilter';
import { ScoreSection } from '@/components/ScoreSection';
import { getTopLeaguesScores } from '@/lib/pipeline/sportsdb';

export const revalidate = 60; // Revalidate every minute

async function getData(retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      const [allArticles, allSettings, scores] = await Promise.all([
        db.select().from(articlesTable).where(eq(articlesTable.status, 'published')).orderBy(desc(articlesTable.id)).limit(40),
        db.select().from(settings),
        getTopLeaguesScores()
      ]);

      const settingsMap: Record<string, string> = {};
      allSettings.forEach(s => settingsMap[s.key] = s.value || '');

      return { allArticles, settingsMap, scores };
    } catch (err) {
      console.error(`[Homepage] DB error (attempt ${i + 1}/${retries}):`, err);
      if (i === retries - 1) return { allArticles: [], settingsMap: {}, scores: [] };
      const delay = Math.min(1000 * Math.pow(2, i), 5000); 
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return { allArticles: [], settingsMap: {}, scores: [] };
}

export default async function Home() {
  const { allArticles, settingsMap, scores } = await getData();

  const featuredArticle = allArticles.length > 0 ? allArticles[0] : null;
  const sidebarArticles = allArticles.slice(1, 4);
  const feedArticles = allArticles.slice(4);

  const homeBanner = settingsMap['ad_homepage_banner'];
  const homeBannerEnabled = settingsMap['ad_homepage_banner_enabled'] === 'true';

  return (
    <div className="min-h-screen bg-black" dir="rtl">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-black py-24 dxt-hero-pattern">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 text-center">
          <div className="inline-block px-4 py-1.5 mb-8 border border-lime/50 text-lime text-[10px] font-black uppercase tracking-[0.4em] bg-lime/5">
            أخبار حصرية وتغطية شاملة
          </div>
          <h1 className="text-6xl md:text-8xl font-black mb-8 italic tracking-tighter uppercase dxt-gradient-text leading-[0.9]">
            ارتقِ بمستوى <br /> متابعتك للكرة
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto font-medium leading-[1.8] mb-12">
            تحليلات تكتيكية عميقة، أخبار الانتقالات العاجلة، <br className="hidden md:block" /> وتقارير حصرية للمشجع النخبوي.
          </p>
          <div className="flex justify-center gap-6">
            <Link href="/category/news" className="bg-lime text-black px-10 py-4 font-black uppercase tracking-widest text-xs hover:bg-white transition-all transform hover:-translate-y-1">
              آخر الأخبار
            </Link>
            <Link href="/category/transfer" className="border border-zinc-800 text-white px-10 py-4 font-black uppercase tracking-widest text-xs hover:bg-zinc-900 transition-all">
              سوق الانتقالات
            </Link>
          </div>
        </div>
      </section>

      {/* Live Scores Section */}
      <ScoreSection scores={scores} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-xs font-black text-lime uppercase tracking-[0.4em] mb-3">أبرز العناوين</h2>
            <h3 className="text-5xl font-black italic tracking-tighter text-white uppercase leading-none">آخر المستجدات</h3>
          </div>

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
                  {featuredArticle.featuredImage ? (
                    <div className="absolute inset-0 z-0">
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent z-10" />
                      <img
                        src={featuredArticle.featuredImage}
                        alt={featuredArticle.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                      />
                    </div>
                  ) : (
                    <div className="absolute top-0 right-0 w-64 h-64 bg-lime/5 rotate-45 translate-x-32 -translate-y-32 z-0" />
                  )}
                  <div className="p-12 flex-1 z-20 flex flex-col justify-end max-w-3xl">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="w-2.5 h-2.5 bg-lime rounded-full shadow-[0_0_15px_rgba(179,212,0,0.9)] animate-pulse" />
                      <span className="text-[10px] font-black text-lime uppercase tracking-[0.3em]">
                        الخبر الرئيسي | {featuredArticle.category === 'news' ? 'أخبار' : featuredArticle.category === 'transfer' ? 'انتقالات' : featuredArticle.category === 'match_report' ? 'تقارير' : featuredArticle.category === 'comparison' ? 'مقارنات' : featuredArticle.category}
                      </span>
                    </div>
                    <h3 className="text-4xl md:text-6xl font-black italic text-white leading-[1.1] mb-8 group-hover:text-lime transition-colors tracking-tighter">
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
                        ? new Date(featuredArticle.publishedAt).toLocaleDateString('ar-EG')
                        : new Date(featuredArticle.createdAt).toLocaleDateString('ar-EG')}
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
                 <h2 className="text-xs font-black text-lime uppercase tracking-[0.6em] mb-4">DX7 ARCADE</h2>
                 <h3 className="text-5xl md:text-7xl font-black italic text-white tracking-tighter uppercase mb-6 leading-none">
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
                <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter flex items-center gap-4">
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
            <p className="text-3xl font-black italic text-white uppercase tracking-tighter">تغطية شاملة لكل زوايا اللعبة</p>
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
                <p className="text-2xl font-black italic text-white uppercase group-hover:text-lime transition-colors mb-3">
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
    </div>
  );
}
