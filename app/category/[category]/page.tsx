import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db/db';
import { articles as articlesTable } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { ArticleCard } from '@/components/ArticleCard';

export const revalidate = 60; // Revalidate every minute

const CATEGORIES = {
  news: 'أخبار عالمية',
  comparison: 'مقارنات تكتيكية',
  poll: 'تصويتات الجمهور',
  match_report: 'تقارير فنية',
  transfer: 'سوق الانتقالات',
  quiz: 'تسلية وألغاز',
};

async function getArticlesByCategory(category: string, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      return await db
        .select()
        .from(articlesTable)
        .where(
          and(
            eq(articlesTable.status, 'published'),
            eq(articlesTable.category, category)
          )
        )
        .orderBy(desc(articlesTable.publishedAt))
        .limit(20);
    } catch (err) {
      console.error(`[CategoryPage] DB error (attempt ${i + 1}/${retries}):`, err);
      if (i === retries - 1) return [];
      const delay = Math.min(1000 * Math.pow(2, i), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return [];
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
    <div className="min-h-screen bg-black" dir="rtl">
      {/* Category Header */}
      <section className="bg-zinc-950 border-b border-zinc-900 py-24 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-lime/30" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-lime/[0.03] rounded-full blur-[120px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link
            href="/"
            className="inline-flex items-center text-zinc-500 hover:text-lime mb-8 transition-colors text-[10px] font-black uppercase tracking-[0.4em] bg-zinc-900/50 px-4 py-1.5 border border-zinc-800"
          >
            العودة للرئيسية ←
          </Link>
          <div className="flex items-center gap-6">
            <div className="w-2 h-16 bg-lime shadow-[0_0_20px_rgba(179,212,0,0.4)]" />
            <div>
              <h2 className="text-[10px] font-black text-lime uppercase tracking-[0.5em] mb-2">تصفح قسم</h2>
              <h1 className="text-5xl md:text-7xl font-black italic text-white uppercase leading-tight py-2">{categoryTitle}</h1>
            </div>
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {articles.length === 0 ? (
          <div className="border border-zinc-900 bg-zinc-950/50 p-32 text-center">
            <p className="text-gray-600 uppercase tracking-[0.3em] font-black text-xs leading-relaxed">
              لا توجد مقالات في هذا القسم حالياً. <br /> تابعنا للمزيد من التغطيات الحصرية قريباً.
            </p>
            <Link href="/" className="mt-8 inline-block text-lime text-xs font-black uppercase tracking-widest border-b border-lime pb-1">
               تصفح الأخبار الأخرى
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>

      {/* Category Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
         <div className="bg-zinc-950 border border-zinc-900 p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-lime/[0.02] rotate-45 translate-x-16 -translate-y-16" />
            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4">هل تريد تغطية خاصة؟</h4>
            <p className="text-gray-500 text-xs font-medium max-w-lg mx-auto leading-loose mb-8">
               نحن نسعى دائماً لتقديم أفضل تحليل تكتيكي وفني. إذا كان لديك موضوع تود أن نقوم بتحليله، تواصل معنا عبر منصات التواصل الاجتماعي.
            </p>
            <div className="flex justify-center gap-6">
               <span className="text-zinc-700 text-[10px] font-black uppercase tracking-[0.3em]">DX7 INTELLIGENCE UNIT</span>
            </div>
         </div>
      </div>
    </div>
  );
}
