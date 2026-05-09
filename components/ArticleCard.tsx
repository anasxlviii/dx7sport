import Link from 'next/link';

export function ArticleCard({ article, compact = false }: { article: any, compact?: boolean }) {
  const categoryMap: Record<string, string> = {
    news: 'أخبار',
    transfer: 'انتقالات',
    comparison: 'مقارنات',
    match_report: 'تقارير'
  };
  
  return (
    <Link
      href={`/article/${article.slug}`}
      className={`group border border-zinc-900 bg-zinc-950 flex flex-col h-full overflow-hidden transition-all hover:border-lime/30 ${compact ? 'hover:bg-zinc-900' : ''}`}
    >
      {article.featuredImage && !compact && (
        <div className="w-full h-56 overflow-hidden relative">
          <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors z-10" />
          <img 
            src={article.featuredImage} 
            alt={article.title} 
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000"
          />
          <div className="absolute top-4 right-4 z-20">
             <span className="bg-black/60 backdrop-blur-md border border-lime/30 text-lime text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1">
               {categoryMap[article.category] || article.category}
             </span>
          </div>
        </div>
      )}
      
      <div className={`${compact ? 'p-8' : 'p-10 flex-1'}`}>
        {compact && (
          <div className="flex items-center gap-3 mb-4">
            <span className="w-1.5 h-1.5 bg-lime rounded-full" />
            <span className="text-[10px] font-black text-lime uppercase tracking-[0.3em]">
              {categoryMap[article.category] || article.category}
            </span>
          </div>
        )}
        
        <h3 className={`${compact ? 'text-xl' : 'text-3xl'} font-black italic text-white leading-tight mb-5 group-hover:text-lime transition-colors line-clamp-3 tracking-tighter`}>
          {article.title}
        </h3>
        
        {!compact && article.excerpt && (
          <p className="text-gray-400 text-sm font-medium line-clamp-3 mb-6 leading-[1.8] border-r border-zinc-800 pr-4">
            {article.excerpt}
          </p>
        )}
      </div>

      <div className={`px-8 py-5 border-t border-zinc-900/50 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] text-gray-600`}>
        <span>
          {article.publishedAt
            ? new Date(article.publishedAt).toLocaleDateString('ar-EG')
            : new Date(article.createdAt).toLocaleDateString('ar-EG')}
        </span>
        <span className="text-lime group-hover:translate-x-[-5px] transition-transform">اقرأ ←</span>
      </div>
    </Link>
  );
}
