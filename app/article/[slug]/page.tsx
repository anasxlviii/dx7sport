import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { db } from '@/lib/db/db';
import { articles, sources, media, settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ArticleRenderer } from '@/components/ArticleRenderer';
import { AdComponent } from '@/components/AdComponent';


export const revalidate = 60; // Revalidate every 60 seconds

async function getArticle(slug: string, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      const [article] = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1);
      if (!article) return null;
      const articleSources = await db.select().from(sources).where(eq(sources.articleId, article.id));
      const articleImages = await db.select().from(media).where(eq(media.articleId, article.id));
      return { ...article, sources: articleSources, images: articleImages };
    } catch (err) {
      console.error(`[ArticlePage] getArticle error (attempt ${i + 1}/${retries}):`, err);
      if (i === retries - 1) return null;
      const delay = Math.min(1000 * Math.pow(2, i), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return null;
}

async function getAdSettings(retries = 5): Promise<Record<string, string>> {
  for (let i = 0; i < retries; i++) {
    try {
      const rows = await db.select().from(settings);
      const result: Record<string, string> = {};
      for (const row of rows) result[row.key] = row.value ?? '';
      return result;
    } catch (err) {
      console.error(`[ArticlePage] getAdSettings error (attempt ${i + 1}/${retries}):`, err);
      if (i === retries - 1) return {};
      const delay = Math.min(1000 * Math.pow(2, i), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return {};
}

function fixContent(content: string): string {
  let text = content;
  text = text.replace(/\\n/g, '\n');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/([^\n])\n(#{1,3} )/g, '$1\n\n$2');
  text = text.replace(/(#{1,3} .+)\n([^\n])/g, '$1\n\n$2');
  text = text.replace(/\\([.,،؛:؟!])/g, '$1');
  return text.trim();
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [article, adSettings] = await Promise.all([getArticle(slug), getAdSettings()]);

  if (!article || article.status !== 'published') notFound();

  // Parse Metadata and fix content
  const metadata = JSON.parse(article.metadata || '{}');
  const quizData = metadata.quizData || null;

  const galleryImages = (article.images || []) as Array<{ id: number; url: string; alt: string }>;
  const categoryLabel = { news: 'أخبار', transfer: 'انتقالات', match_report: 'تقارير المباريات', comparison: 'مقارنات' }[article.category] ?? article.category;
  const pubDate = (article.publishedAt ?? article.createdAt) ? new Date(article.publishedAt ?? article.createdAt).toLocaleDateString('ar-EG', { numberingSystem: 'latn' }) : '';
  const fixedExcerpt = article.excerpt?.replace(/\\n/g, ' ').replace(/\n+/g, ' ').trim() ?? '';

  return (
    <div className="min-h-screen bg-black">
      <article className="relative overflow-hidden" style={{ minHeight: '520px' }}>
        {article.featuredImage ? (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${article.featuredImage}')` }} />
        ) : (
          <div className="absolute inset-0 bg-zinc-900 dxt-hero-pattern" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 flex flex-col justify-end" style={{ minHeight: '520px' }}>
          <Link href="/" className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-lime hover:text-white mb-8 transition-colors self-start">
            → العودة للأخبار
          </Link>
          <div className="flex items-center gap-2 mb-5">
            <span className="w-2 h-2 bg-lime rounded-full shadow-[0_0_8px_rgba(179,212,0,0.9)] animate-pulse" />
            <span className="text-xs font-bold text-lime uppercase tracking-widest">الخبر الرئيسي | {categoryLabel}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black italic uppercase text-white leading-[1.3] mb-6 py-2">
            {article.title}
          </h1>
          {fixedExcerpt && (
            <p className="text-base md:text-lg text-gray-200 font-semibold leading-relaxed mb-6 border-r-4 border-lime pr-5 max-w-2xl">
              {fixedExcerpt}
            </p>
          )}
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
            <span className="text-lime">تاريخ النشر:</span>
            <span>{pubDate}</span>
          </div>
        </div>
      </article>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            {metadata.factBox && (
              <div className="bg-lime/5 border-r-4 border-lime p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-20 h-20 bg-lime/5 rotate-45 -translate-x-10 -translate-y-10" />
                <h3 className="text-xs font-black text-lime uppercase tracking-[0.3em] mb-5">⚡ بعض الحقائق</h3>
                <div className="space-y-2">
                  {metadata.factBox.replace(/\\n/g, '\n').split('\n').filter((l: string) => l.trim()).map((line: string, i: number) => (
                    <p key={i} className="text-gray-200 font-medium leading-relaxed text-sm flex items-start gap-2">
                      <span className="text-lime font-black mt-0.5 shrink-0">—</span>
                      <span>{line.replace(/^[-–—]\s*/, '')}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}

            <ArticleRenderer
              content={article.content}
              galleryImages={galleryImages}
              adMidArticle={adSettings.ad_article_mid}
              adMidEnabled={adSettings.ad_article_mid_enabled === 'true'}
              quizData={quizData}
            />

            {adSettings.ad_article_bottom_enabled === 'true' && adSettings.ad_article_bottom && (
              <div className="my-12">
                <p className="text-[9px] font-black uppercase tracking-[0.5em] text-zinc-800 mb-4 text-center">إعلان</p>
                <AdComponent code={adSettings.ad_article_bottom} />
              </div>
            )}

            {galleryImages.length > 0 && (
              <div className="pt-8 border-t border-border-subtle">
                <h3 className="text-xs font-black text-lime uppercase tracking-[0.3em] mb-6">معرض الصور</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {galleryImages.map(img => (
                    <img key={img.id} src={img.url} alt={img.alt || article.title} className="w-full h-56 object-cover border border-border-subtle" />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-8">
            {/* Removed Sources section as requested */}

            {adSettings.ad_sidebar_enabled === 'true' && adSettings.ad_sidebar && (
              <div className="mb-8">
                <p className="text-[9px] font-black uppercase tracking-[0.5em] text-zinc-800 mb-4 text-center">إعلان</p>
                <AdComponent code={adSettings.ad_sidebar} />
              </div>
            )}

            {adSettings.ad_smartlink_enabled === 'true' && adSettings.ad_smartlink && (
              <div className="mb-8">
                <a 
                  href={adSettings.ad_smartlink} 
                  target="_blank" 
                  rel="nofollow noopener"
                  className="
                    block w-full p-6 bg-gradient-to-br from-lime to-lime/80 text-black font-black text-center uppercase tracking-[0.2em] 
                    shadow-[0_10px_30px_rgba(158,255,0,0.3)] hover:shadow-[0_20px_50px_rgba(158,255,0,0.5)] 
                    hover:-translate-y-1 transition-all active:scale-95 text-sm
                  "
                >
                  🚀 استكشاف المزيد (Smart Insights)
                </a>
              </div>
            )}

            <div className="dxt-card p-8">
              <h3 className="text-xs font-black text-lime uppercase tracking-[0.3em] mb-6">أخبار ذات صلة</h3>
              <nav className="flex flex-col gap-4">
                {[
                  { href: '/category/news', label: 'أخبار عالمية' },
                  { href: '/category/transfer', label: 'أخبار الانتقالات' },
                  { href: '/category/comparison', label: 'مقارنات' },
                  { href: '/category/match_report', label: 'تقارير المباريات' },
                ].map(l => (
                  <Link key={l.href} href={l.href}
                    className="text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-lime transition-all flex items-center justify-between group">
                    {l.label}
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">←</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border-t border-border-subtle">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h3 className="font-bold text-white uppercase tracking-widest text-xs mb-4">شارك المقال</h3>
          <div className="flex gap-4">
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://dx7sport.com/article/${article.slug}`)}`}
              target="_blank" rel="noopener"
              className="px-4 py-2 border border-blue-800 text-blue-400 text-xs font-bold uppercase hover:bg-blue-900/20 transition-all">
              فيسبوك
            </a>
            <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://dx7sport.com/article/${article.slug}`)}&text=${encodeURIComponent(article.title)}`}
              target="_blank" rel="noopener"
              className="px-4 py-2 border border-sky-800 text-sky-400 text-xs font-bold uppercase hover:bg-sky-900/20 transition-all">
              تويتر / X
            </a>
            <a href={`https://wa.me/?text=${encodeURIComponent(article.title + ' ' + `https://dx7sport.com/article/${article.slug}`)}`}
              target="_blank" rel="noopener"
              className="px-4 py-2 border border-green-800 text-green-400 text-xs font-bold uppercase hover:bg-green-900/20 transition-all">
              واتساب
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: 'غير موجود' };

  const description = article.excerpt?.replace(/\\n/g, ' ').replace(/\n/g, ' ').slice(0, 160) || article.title;
  
  // Use relative URLs or let the platform handle it
  const canonical = `/article/${slug}`;
  const imageUrl = article.featuredImage || '/default-share.jpg';
  
  return {
    title: article.title,
    description,
    openGraph: {
      title: article.title,
      description,
      url: canonical,
      siteName: 'DX7 SPORT',
      type: 'article',
      images: [imageUrl],
    },
    twitter: {
      card: 'summary_large_image',
      images: [imageUrl],
    },
    metadataBase: null, // Let Next.js handle relative URLs or set it dynamically if needed
  };
}
